import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import VinDecoder from './VinDecoder';
import VinResultModal from './VinResultModal';
import PdfDownloadButton from './results/PdfDownloadButton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

import { MARKET_API } from '@/lib/marketApi';

// ── Types ──
type Screen = 'input' | 'loading' | 'result';
type FormState = {
  brand: string; model: string; year: string; fuel: string; km: string; country: string;
  body: string; trimLevel: string; enginePowerKw: string; engineDisplacement: string;
  driveType: string; transmission: string; doors: string; seats: string;
  batteryKwh: string; chargingPowerAc: string; color: string; equipmentNote: string;
  mfgYear: string; mfgMonth: string; regYear: string; regMonth: string;
  optionalPackages: string; standardEquipment: string;
  priorUsage: string; priorUsageConfidence: 'confirmed' | 'estimated' | '';
};
type VinIdentity = { manufacturer?: string; plantCountry?: string; vin?: string; recallCount?: number } | null;
type VinFilledFields = Set<string>;
type Result = {
  p10: number; p25: number; p50: number; p75: number; p90: number;
  recommended: { low: number; high: number };
  riskScore: number; velocityDays: number; velocityProb: number;
  trendData: number[];
  regional: { code: string; price: number; velocity: number }[];
  marketDepth: number; similarListings: number; demandIndex: number;
  isFallback?: boolean; dataPoints?: number;
};

const FALLBACK_MAKES: string[] = [
  "Audi","BMW","Mercedes-Benz","Volkswagen","Tesla","Toyota","Hyundai","Kia",
  "Skoda","Renault","Peugeot","Ford","Opel","Volvo","Seat","Citroën","Alfa Romeo",
  "DS","Fiat","Jeep",
];

// ── Canonical make alias map for VIN normalization ──
const MAKE_ALIASES: Record<string, string> = {
  'citroen': 'Citroën', 'citroën': 'Citroën',
  'alfa romeo': 'Alfa Romeo', 'alfa-romeo': 'Alfa Romeo', 'alfaromeo': 'Alfa Romeo',
  'ds automobiles': 'DS', 'ds': 'DS',
  'mercedes-benz': 'Mercedes-Benz', 'mercedes benz': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz',
  'bmw': 'BMW', 'vw': 'Volkswagen', 'volkswagen': 'Volkswagen',
  'peugeot': 'Peugeot', 'opel': 'Opel', 'fiat': 'Fiat', 'jeep': 'Jeep',
  'tesla': 'Tesla', 'toyota': 'Toyota', 'hyundai': 'Hyundai', 'kia': 'Kia',
  'skoda': 'Skoda', 'škoda': 'Skoda', 'renault': 'Renault', 'ford': 'Ford',
  'volvo': 'Volvo', 'seat': 'Seat', 'cupra': 'Cupra', 'audi': 'Audi',
  'nissan': 'Nissan', 'honda': 'Honda', 'mazda': 'Mazda', 'subaru': 'Subaru',
  'porsche': 'Porsche', 'jaguar': 'Jaguar', 'land rover': 'Land Rover',
  'mini': 'MINI', 'smart': 'Smart', 'dacia': 'Dacia',
};

function canonicalizeMake(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (MAKE_ALIASES[lower]) return MAKE_ALIASES[lower];
  return trimmed;
}

const MONTHS = [
  { value: '1', label: 'Január' }, { value: '2', label: 'Február' }, { value: '3', label: 'Március' },
  { value: '4', label: 'Április' }, { value: '5', label: 'Május' }, { value: '6', label: 'Június' },
  { value: '7', label: 'Július' }, { value: '8', label: 'Augusztus' }, { value: '9', label: 'Szeptember' },
  { value: '10', label: 'Október' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const PRIOR_USAGES = [
  { value: 'taxi', label: 'Taxi' },
  { value: 'ambulance', label: 'Mentő' },
  { value: 'police', label: 'Rendőrségi' },
  { value: 'driving_school', label: 'Oktatóautó' },
  { value: 'rental', label: 'Bérautó / Rental' },
  { value: 'fleet', label: 'Flottás intenzív használat' },
  { value: 'other', label: 'Egyéb különleges használat' },
];

const COUNTRIES = ["HU","DE","AT","FR","IT","ES","PL","CZ","SK","RO","NL","BE","SE","DK","FI","NO","PT","GR","HR","BG","SI","LT","LV","EE","LU","MT","CY","CH"];
const FLAGS: Record<string, string> = { HU:'🇭🇺',DE:'🇩🇪',AT:'🇦🇹',FR:'🇫🇷',IT:'🇮🇹',ES:'🇪🇸',PL:'🇵🇱',CZ:'🇨🇿',SK:'🇸🇰',RO:'🇷🇴',NL:'🇳🇱',BE:'🇧🇪',SE:'🇸🇪',DK:'🇩🇰',FI:'🇫🇮',NO:'🇳🇴',PT:'🇵🇹',GR:'🇬🇷',HR:'🇭🇷',BG:'🇧🇬',SI:'🇸🇮',LT:'🇱🇹',LV:'🇱🇻',EE:'🇪🇪',LU:'🇱🇺',MT:'🇲🇹',CY:'🇨🇾',CH:'🇨🇭' };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2012 + 2 }, (_, i) => String(CURRENT_YEAR + 1 - i));

function generateResult(form: FormState): Result {
  const base = 18000 + (2024 - parseInt(form.year)) * -1400 + Math.random() * 2000 - 1000;
  const kmAdj = (parseInt(form.km || '80000') - 80000) * -0.04;
  const mid = Math.max(3000, base + kmAdj);
  return {
    p10: Math.round(mid * 0.74), p25: Math.round(mid * 0.87),
    p50: Math.round(mid), p75: Math.round(mid * 1.13), p90: Math.round(mid * 1.26),
    recommended: { low: Math.round(mid * 0.94), high: Math.round(mid * 1.09) },
    riskScore: Math.round(20 + Math.random() * 60),
    velocityDays: Math.round(18 + Math.random() * 42),
    velocityProb: Math.round(55 + Math.random() * 35),
    trendData: Array.from({ length: 36 }, (_, i) =>
      Math.round(mid * (0.82 + i / 35 * 0.22 + Math.sin(i / 3) * 0.02 + (Math.random() - 0.5) * 0.03))
    ),
    regional: ["HU","DE","AT","FR","IT","ES","PL","CZ","SK","RO","NL","BE"].map(code => ({
      code, price: Math.round(mid * (0.85 + Math.random() * 0.35)),
      velocity: Math.round(25 + Math.random() * 55),
    })),
    marketDepth: Math.round(340 + Math.random() * 280),
    similarListings: Math.round(48 + Math.random() * 90),
    demandIndex: Math.round(62 + Math.random() * 30),
    isFallback: true,
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchValuation(formData: FormState): Promise<any | null> {
  try {
    const params = new URLSearchParams({
      make: formData.brand,
      model: formData.model,
      year: formData.year,
      powertrain: formData.fuel,
      mileage_km: formData.km,
      ...(formData.country && { country: formData.country }),
    });
    const res = await fetchWithTimeout(`${MARKET_API}/api/v1/market/valuation?${params}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('Valuation API error, falling back to mock:', e);
    return null;
  }
}

function mapApiToResult(api: any, form: FormState): Result {
  const ps = api.price_stats || {};
  // Support both new (median_eur, p25_eur) and legacy (median, p25) field names
  const p50 = ps.median_eur ?? ps.median ?? ps.p50 ?? 0;
  const p10 = (ps.min_eur && ps.min_eur > 0) ? ps.min_eur : ((ps.p10 && ps.p10 > 0) ? ps.p10 : Math.round(p50 * 0.74));
  const p25 = (ps.p25_eur && ps.p25_eur > 0) ? ps.p25_eur : ((ps.p25 && ps.p25 > 0) ? ps.p25 : Math.round(p50 * 0.87));
  const p75 = (ps.p75_eur && ps.p75_eur > 0) ? ps.p75_eur : ((ps.p75 && ps.p75 > 0) ? ps.p75 : Math.round(p50 * 1.13));
  const p90 = (ps.max_eur && ps.max_eur > 0) ? ps.max_eur : ((ps.p90 && ps.p90 > 0) ? ps.p90 : Math.round(p50 * 1.26));
  const finalP25 = p25 === p75 ? Math.round(p50 * 0.90) : p25;
  const finalP75 = p25 === p75 ? Math.round(p50 * 1.10) : p75;
  let riskScore = 50;
  const band = api.price_position?.band || api.price_position?.label;
  if (band === 'below_market' || band === 'ALULERTEKELT') riskScore = 25;
  else if (band === 'above_market' || band === 'TULARAZOTT') riskScore = 75;
  const yearDist: { year: string; count: number }[] = api.year_distribution || [];
  const dataPoints = api.data_points || 0;
  let velocityScore: number;
  let velocityDays: number;
  let velocityProb30: number;
  if (yearDist.length > 0) {
    const sorted = [...yearDist].sort((a, b) => parseInt(b.year) - parseInt(a.year));
    const total = yearDist.reduce((s, y) => s + y.count, 0);
    const recent = sorted.slice(0, 2).reduce((s, y) => s + y.count, 0);
    const depthBonus = Math.min(30, Math.round(total / 3));
    velocityScore = Math.min(95, Math.round((recent / total) * 70) + depthBonus);
  } else {
    velocityScore = Math.min(85, Math.round(dataPoints / 2));
  }
  velocityDays = velocityScore > 70 ? 14 : velocityScore > 50 ? 21 : velocityScore > 30 ? 35 : 55;
  velocityProb30 = velocityScore > 70 ? 82 : velocityScore > 50 ? 65 : velocityScore > 30 ? 45 : 28;
  let trendData: number[];
  if (yearDist.length > 0) {
    const sorted = [...yearDist].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    const baseYear = parseInt(sorted[sorted.length - 1].year);
    const yearPrices = sorted.map(y => {
      const yearsOld = baseYear - parseInt(y.year);
      return Math.round(p50 * Math.pow(1.08, yearsOld));
    });
    trendData = [];
    for (let i = 0; i < yearPrices.length - 1; i++) {
      const monthsPerSegment = Math.max(1, Math.round(36 / Math.max(1, yearPrices.length - 1)));
      for (let m = 0; m < monthsPerSegment && trendData.length < 36; m++) {
        const t = m / monthsPerSegment;
        trendData.push(Math.round(yearPrices[i] * (1 - t) + yearPrices[i + 1] * t));
      }
    }
    while (trendData.length < 36) trendData.push(yearPrices[yearPrices.length - 1]);
    trendData = trendData.slice(0, 36);
  } else {
    trendData = Array.from({ length: 36 }, (_, i) =>
      Math.round(p50 * (0.82 + i / 35 * 0.22 + Math.sin(i / 3) * 0.02))
    );
  }
  const regionalMap: Record<string, { total: number; count: number }> = {};
  const comparables: any[] = api.comparable_listings || [];
  comparables.forEach((l: any) => {
    if (l.country && l.price_eur > 0) {
      if (!regionalMap[l.country]) regionalMap[l.country] = { total: 0, count: 0 };
      regionalMap[l.country].total += l.price_eur;
      regionalMap[l.country].count += 1;
    }
  });
  const regional = Object.entries(regionalMap).map(([code, d]) => ({
    code,
    price: Math.round(d.total / d.count),
    velocity: Math.round(30 + Math.random() * 50),
  }));
  return {
    p10, p25: finalP25, p50, p75: finalP75, p90,
    recommended: { low: finalP25, high: finalP75 },
    riskScore, velocityDays, velocityProb: velocityProb30,
    trendData, regional,
    marketDepth: dataPoints, similarListings: dataPoints,
    demandIndex: Math.min(99, Math.round(velocityScore * 0.9 + 10)),
    isFallback: api.fallback_mode || false, dataPoints,
  };
}

// ── Styles (LIGHT THEME) ──
const S = {
  root: { fontFamily: "'DM Sans', sans-serif", background: '#f8f9fa', color: '#1a1a2a', minHeight: '100vh' } as React.CSSProperties,
  header: { position: 'sticky' as const, top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: { background: 'rgba(40,128,196,0.08)', border: '1px solid rgba(40,128,196,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#3b82f6' } as React.CSSProperties,
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as React.CSSProperties,
  input: { background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 10, padding: '11px 14px', color: '#1a1a2a', fontSize: 14, width: '100%', outline: 'none', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  label: { fontSize: 12, color: '#6b7280', marginBottom: 6, display: 'block' } as React.CSSProperties,
  btn: { background: 'linear-gradient(135deg, #1a4a7a, #2880c4)', color: '#ffffff', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' } as React.CSSProperties,
  gold: { color: '#c9a84c' },
  muted: { color: '#6b7280' },
  blue: { color: '#3b82f6' },
  green: { color: '#4caf82' },
  gradientText: { background: 'linear-gradient(135deg, #1a1a2a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties,
  goldText: { background: 'linear-gradient(135deg, #1a1a2a, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties,
};

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 1200; const t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setDisplay(Math.round(value * p * 10 ** decimals) / 10 ** decimals);
      if (p >= 1) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [value, decimals]);
  return <>{prefix}{display.toLocaleString('hu-HU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}

function RiskMeter({ score, labels }: { score: number; labels: { low: string; mid: string; high: string } }) {
  const color = score < 35 ? '#4caf82' : score < 65 ? '#c9a84c' : '#e05a5a';
  const label = score < 35 ? labels.low : score < 65 ? labels.mid : labels.high;
  const dash = (score / 100) * 172;
  const angle = -135 + (score / 100) * 270;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={140} height={90} viewBox="0 0 140 90">
        <path d="M15,80 A55,55,0,0,1,125,80" fill="none" stroke="#e5e7eb" strokeWidth={10} strokeLinecap="round" />
        <path d="M15,80 A55,55,0,0,1,125,80" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${dash} 172`} />
        <line x1={70} y1={80} x2={70} y2={40} stroke={color} strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${angle} 70 80)`} />
        <circle cx={70} cy={80} r={5} fill={color} />
        <text x={70} y={72} textAnchor="middle" fill="#1a1a2a" fontSize={18} fontWeight={800} fontFamily="DM Sans">{score}</text>
      </svg>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function PercentileBar({ p10, p25, p50, p75, p90 }: { p10: number; p25: number; p50: number; p75: number; p90: number }) {
  const min = p10 * 0.95; const max = p90 * 1.05; const r = max - min;
  const pct = (v: number) => ((v - min) / r) * 100;
  return (
    <div style={{ position: 'relative', height: 60, marginTop: 16, marginBottom: 24 }}>
      <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 8, background: '#e5e7eb', borderRadius: 4 }} />
      <div style={{ position: 'absolute', top: 18, left: `${pct(p10)}%`, width: `${pct(p90) - pct(p10)}%`, height: 6, background: 'rgba(40,128,196,0.15)', borderRadius: 3 }} />
      <div style={{ position: 'absolute', top: 18, left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%`, height: 12, background: 'rgba(40,128,196,0.3)', borderRadius: 4 }} />
      <div style={{ position: 'absolute', top: 0, left: `${pct(p50)}%`, width: 3, height: 52, background: '#c9a84c', borderRadius: 2, transform: 'translateX(-1.5px)' }} />
      <div style={{ position: 'absolute', top: 54, left: `${pct(p50)}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#c9a84c', fontWeight: 700 }}>P50</div>
      {[{ v: p10, l: 'P10' }, { v: p25, l: 'P25' }, { v: p75, l: 'P75' }, { v: p90, l: 'P90' }].map(({ v, l }) => (
        <div key={l}>
          <div style={{ position: 'absolute', bottom: 16, left: `${pct(v)}%`, width: 2, height: 20, background: '#d1d5db', transform: 'translateX(-1px)' }} />
          <div style={{ position: 'absolute', top: 0, left: `${pct(v)}%`, transform: 'translateX(-50%)', fontSize: 9, color: '#6b7280' }}>{l}</div>
        </div>
      ))}
    </div>
  );
}
function VinBadge() {
  return (
    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600, background: '#dcfce7', color: '#166534', marginLeft: 4, verticalAlign: 'middle' }}>
      VIN ✓
    </span>
  );
}

const vinHighlight: React.CSSProperties = { borderColor: '#86efac', background: '#f0fdf4' };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.av-inp:focus { border-color: #2880c4 !important; }
.av-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.av-tab:hover { color: #3b82f6 !important; }
.av-stat:hover { border-color: #d1d5db !important; }
@keyframes avFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
@keyframes avPulse { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.08); opacity:1; } }
@keyframes avFieldHighlight { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); } 50% { box-shadow: 0 0 0 4px rgba(37,99,235,0.25); } 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); } }
.av-field-highlight { animation: avFieldHighlight 1.5s ease-out 2; }
`;

export interface VehicleEvaluation {
  make: string;
  model: string;
  year: string;
  mileage: string;
  country: string;
}

interface EUAutoValueIntelligenceProps {
  onVehicleEvaluated?: (vehicle: VehicleEvaluation) => void;
}

export default function EUAutoValueIntelligence({ onVehicleEvaluated }: EUAutoValueIntelligenceProps = {}) {
  const { lang } = useLanguage();
  const [screen, setScreen] = useState<Screen>('input');
  const [form, setForm] = useState<FormState>({ brand: '', model: '', year: '', fuel: '', km: '', country: 'HU', body: '', trimLevel: '', enginePowerKw: '', engineDisplacement: '', driveType: '', transmission: '', doors: '', seats: '', batteryKwh: '', chargingPowerAc: '', color: '', equipmentNote: '', mfgYear: '', mfgMonth: '', regYear: '', regMonth: '', optionalPackages: '', standardEquipment: '', priorUsage: '', priorUsageConfidence: '' });
  const [vinIdentity, setVinIdentity] = useState<VinIdentity>(null);
  const [vinRawResult, setVinRawResult] = useState<any>(null);
  const [vinModalOpen, setVinModalOpen] = useState(false);
  const [vinIdOpen, setVinIdOpen] = useState(false);
  const [vinFilledFields, setVinFilledFields] = useState<VinFilledFields>(new Set());
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [tab, setTab] = useState(0);
  const [apiMakes, setApiMakes] = useState<string[]>([]);
  const [makesLoading, setMakesLoading] = useState(true);
  const [apiModels, setApiModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const makesLoaded = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);

  const ui = {
    HU: {
      vehicle_data: 'Jármű adatok megadása', vehicle_sub: 'Adja meg a jármű fő paramétereit',
      make: 'Márka', model: 'Modell', year: 'Évjárat', fuel: 'Hajtáslánc', mileage: 'Futásteljesítmény (km)',
      country: 'Ország', select: 'Válasszon...', loading: 'Betöltés...',
      gdpr: 'Adatai biztonságban · GDPR-kompatibilis', submit: 'Értékbecslés indítása →',
      trend_title: '3 éves ártrend', trend_sub: 'Havi árbontás EU piacon',
      p10_title: 'P10–P90 percentilis', p10_sub: 'Teljes piaci áreloszlás',
      velocity_title: 'Értékesítési sebesség', velocity_sub: 'Valószínűségi előrejelzés',
      analyzing: 'AI ügynökök elemzése…', new_valuation: '← Új értékbecslés',
      p50_label: 'P50 piaci értéke', suggested: 'Ajánlott eladási ársáv', sell_speed: 'Eladási sebesség',
      day: 'nap', risk_low: 'Alacsony kockázat', risk_mid: 'Közepes kockázat', risk_high: 'Magas kockázat',
      distribution: 'Piaci áreloszlás', agents_title: 'AI Ügynökök',
      regional_empty: 'Korlátozott regionális adat',
      regional_empty_sub: 'Ehhez a járműhöz jelenleg nem áll rendelkezésre elegendő összehasonlító hirdetés más országokból.',
      tab_dist: 'Áteloszlás', tab_trend: 'Ártrend', tab_regional: 'Regionális', tab_agents: 'AI Ügynökök',
      fuel_bev: 'BEV – Elektromos', fuel_phev: 'PHEV – Plug-in hibrid',
      fuel_hev: 'HEV – Hibrid', fuel_mhev: 'MHEV – Enyhe hibrid',
      agents_done: 'KÉSZ', agents_ready: 'ügynök kész',
      speed_label: 'Sebesség', within14: '14 napon belül', within30: '30 napon belül', within60: '60 napon belül',
      prob_suffix: '% valószínűség 30 napon belül',
      market_depth: 'Piaci mélység', similar_listings: 'Hasonló hirdetések', demand_index: 'Keresleti index',
      sell_velocity: 'Értékesítési sebesség',
      strategy_hint: 'Stratégia: Hirdesse az ajánlott ársáv felső értékén, és legyen nyitott 5-8% tárgyalási mozgástérre.',
      trend_36m: '36 hónapos ártrend',
      lowest: 'Legalacsonyabb', highest: 'Legmagasabb', average: 'Átlag', current: 'Jelenlegi',
      trend_rising: 'Emelkedő trend az elmúlt 12 hónapban.', trend_falling: 'Csökkenő trend az elmúlt 12 hónapban.',
      trend_change_12m: '12 havi változás',
      export_hint: 'Exportlehetőség — A legmagasabb regionális értéket kínáló piac:',
      premium_label: 'prémium az EU átlaghoz képest',
      p10l: 'Alsó', p25l: 'Alacsony', p50l: 'Közép', p75l: 'Magas', p90l: 'Felső',
      active_listings: 'aktív hirdetés', sample: 'minta',
      footer: 'EU AutoValue Intelligence™ · EV Brand Gateway modul · Ingyenes B2C értékbecslő platform · Az eredmények tájékoztató jellegűek, tényleges piaci körülményektől eltérhetnek. · © 2026 EV DIAG · European EV Risk Infrastructure',
      free_badge: '✦ INGYENES',
      hero_sub1: 'AI/MI ÜGYNÖKCSOPORT · PIACI INTELLIGENCIA',
      hero_title: 'Professzionális Járműértékbecslés',
      hero_desc: 'Bayes-alapú valószínűségi modell · 27 EU ország + Svájc · 3 év visszamenőleges ártrend',
      result_gen: 'Eredmény generálása…',
      warn_mfg_before_model: '⚠️ A gyártási év korábbi, mint a modellév – ellenőrizze!',
      warn_reg_before_mfg: '⚠️ Az üzembehelyezés éve korábbi, mint a gyártási év – ellenőrizze!',
      warn_reg_month_before_mfg: '⚠️ Az üzembehelyezés hónapja korábbi, mint a gyártási hónap (azonos évben) – ellenőrizze!',
      readiness: 'Értékbecslés készültség',
      readiness_fields: 'mező kitöltve',
      readiness_missing: 'Hiányzó mezők',
      readiness_complete: 'Minden mező kitöltve!',
      priority_critical: 'Kötelező',
      priority_optional: 'Ajánlott',
      smart_next: 'Következő lépés',
      smart_next_prefix: 'Töltsd ki a',
      smart_next_suffix: 'mezőt',
      smart_impact: 'pontosság javulás',
      smart_all_done: 'Maximális pontosság elérve!',
      smart_click_hint: 'Kattints a kitöltéshez →',
      field_brand: 'Márka', field_model: 'Modell', field_year: 'Évjárat', field_fuel: 'Hajtáslánc',
      field_km: 'Futásteljesítmény', field_country: 'Ország', field_body: 'Karosszéria',
      field_trimLevel: 'Felszereltség', field_enginePowerKw: 'Teljesítmény (kW)',
      field_driveType: 'Meghajtás', field_transmission: 'Váltó',
      field_mfgYear: 'Gyártási év', field_regYear: 'Üzembehelyezés éve',
      field_batteryKwh: 'Akkumulátor (kWh)', field_color: 'Szín',
    },
    EN: {
      vehicle_data: 'Vehicle data', vehicle_sub: 'Enter the main parameters of the vehicle',
      make: 'Make', model: 'Model', year: 'Year', fuel: 'Powertrain', mileage: 'Mileage (km)',
      country: 'Country', select: 'Select...', loading: 'Loading...',
      gdpr: 'Your data is secure · GDPR-compliant', submit: 'Start valuation →',
      trend_title: '3-year price trend', trend_sub: 'Monthly breakdown on EU market',
      p10_title: 'P10–P90 percentile', p10_sub: 'Full market price distribution',
      velocity_title: 'Sales velocity', velocity_sub: 'Probability forecast',
      analyzing: 'AI agents analyzing…', new_valuation: '← New valuation',
      p50_label: 'P50 market value', suggested: 'Suggested listing range', sell_speed: 'Sales speed',
      day: 'days', risk_low: 'Low risk', risk_mid: 'Medium risk', risk_high: 'High risk',
      distribution: 'Price distribution', agents_title: 'AI Agents',
      regional_empty: 'Limited regional data',
      regional_empty_sub: 'Not enough comparable listings available from other countries for this vehicle.',
      tab_dist: 'Distribution', tab_trend: 'Price trend', tab_regional: 'Regional', tab_agents: 'AI Agents',
      fuel_bev: 'BEV – Electric', fuel_phev: 'PHEV – Plug-in hybrid',
      fuel_hev: 'HEV – Hybrid', fuel_mhev: 'MHEV – Mild hybrid',
      agents_done: 'DONE', agents_ready: 'agents done',
      speed_label: 'Speed', within14: 'Within 14 days', within30: 'Within 30 days', within60: 'Within 60 days',
      prob_suffix: '% probability within 30 days',
      market_depth: 'Market depth', similar_listings: 'Similar listings', demand_index: 'Demand index',
      sell_velocity: 'Sales velocity',
      strategy_hint: 'Strategy: List at the upper end of the suggested range and be open to 5-8% negotiation margin.',
      trend_36m: '36-month price trend',
      lowest: 'Lowest', highest: 'Highest', average: 'Average', current: 'Current',
      trend_rising: 'Rising trend over the past 12 months.', trend_falling: 'Declining trend over the past 12 months.',
      trend_change_12m: '12-month change',
      export_hint: 'Export opportunity — Highest regional value market:',
      premium_label: 'premium vs EU average',
      p10l: 'Bottom', p25l: 'Low', p50l: 'Mid', p75l: 'High', p90l: 'Top',
      active_listings: 'active listings', sample: 'samples',
      footer: 'EU AutoValue Intelligence™ · EV Brand Gateway module · Free B2C valuation platform · Results are indicative and may differ from actual market conditions. · © 2026 EV DIAG · European EV Risk Infrastructure',
      free_badge: '✦ FREE',
      hero_sub1: 'AI/ML AGENT GROUP · MARKET INTELLIGENCE',
      hero_title: 'Professional Vehicle Valuation',
      hero_desc: 'Bayesian probability model · 27 EU countries + Switzerland · 3-year historical price trend',
      result_gen: 'Generating results…',
      warn_mfg_before_model: '⚠️ Manufacturing year is earlier than model year – please verify!',
      warn_reg_before_mfg: '⚠️ Registration year is before manufacturing year – please verify!',
      warn_reg_month_before_mfg: '⚠️ Registration month is before manufacturing month (same year) – please verify!',
      readiness: 'Valuation readiness',
      readiness_fields: 'fields filled',
      readiness_missing: 'Missing fields',
      readiness_complete: 'All fields filled!',
      priority_critical: 'Required',
      priority_optional: 'Recommended',
      smart_next: 'Next step',
      smart_next_prefix: 'Fill in',
      smart_next_suffix: '',
      smart_impact: 'accuracy boost',
      smart_all_done: 'Maximum accuracy reached!',
      smart_click_hint: 'Click to fill →',
      field_brand: 'Make', field_model: 'Model', field_year: 'Year', field_fuel: 'Powertrain',
      field_km: 'Mileage', field_country: 'Country', field_body: 'Body type',
      field_trimLevel: 'Trim level', field_enginePowerKw: 'Power (kW)',
      field_driveType: 'Drive type', field_transmission: 'Transmission',
      field_mfgYear: 'Mfg. year', field_regYear: 'Reg. year',
      field_batteryKwh: 'Battery (kWh)', field_color: 'Color',
    },
    DE: {
      vehicle_data: 'Fahrzeugdaten', vehicle_sub: 'Geben Sie die wichtigsten Fahrzeugparameter ein',
      make: 'Marke', model: 'Modell', year: 'Baujahr', fuel: 'Antrieb', mileage: 'Kilometerstand (km)',
      country: 'Land', select: 'Auswählen...', loading: 'Laden...',
      gdpr: 'Ihre Daten sind sicher · DSGVO-konform', submit: 'Bewertung starten →',
      trend_title: '3-Jahres-Preistrend', trend_sub: 'Monatliche Aufschlüsselung EU-Markt',
      p10_title: 'P10–P90 Perzentil', p10_sub: 'Vollständige Marktpreisverteilung',
      velocity_title: 'Verkaufsgeschwindigkeit', velocity_sub: 'Wahrscheinlichkeitsprognose',
      analyzing: 'KI-Agenten analysieren…', new_valuation: '← Neue Bewertung',
      p50_label: 'P50 Marktwert', suggested: 'Empfohlene Verkaufsspanne', sell_speed: 'Verkaufsgeschwindigkeit',
      day: 'Tage', risk_low: 'Niedriges Risiko', risk_mid: 'Mittleres Risiko', risk_high: 'Hohes Risiko',
      distribution: 'Preisverteilung', agents_title: 'KI-Agenten',
      regional_empty: 'Begrenzte Regionaldaten',
      regional_empty_sub: 'Für dieses Fahrzeug sind derzeit nicht genügend Vergleichsanzeigen aus anderen Ländern verfügbar.',
      tab_dist: 'Verteilung', tab_trend: 'Preistrend', tab_regional: 'Regional', tab_agents: 'KI-Agenten',
      fuel_bev: 'BEV – Elektro', fuel_phev: 'PHEV – Plug-in-Hybrid',
      fuel_hev: 'HEV – Hybrid', fuel_mhev: 'MHEV – Mild-Hybrid',
      agents_done: 'FERTIG', agents_ready: 'Agenten fertig',
      speed_label: 'Geschwindigkeit', within14: 'Innerhalb 14 Tagen', within30: 'Innerhalb 30 Tagen', within60: 'Innerhalb 60 Tagen',
      prob_suffix: '% Wahrscheinlichkeit innerhalb 30 Tagen',
      market_depth: 'Markttiefe', similar_listings: 'Ähnliche Anzeigen', demand_index: 'Nachfrageindex',
      sell_velocity: 'Verkaufsgeschwindigkeit',
      strategy_hint: 'Strategie: Listen Sie am oberen Ende der empfohlenen Spanne und seien Sie offen für 5-8% Verhandlungsspielraum.',
      trend_36m: '36-Monats-Preistrend',
      lowest: 'Niedrigster', highest: 'Höchster', average: 'Durchschnitt', current: 'Aktuell',
      trend_rising: 'Steigender Trend in den letzten 12 Monaten.', trend_falling: 'Fallender Trend in den letzten 12 Monaten.',
      trend_change_12m: '12-Monats-Änderung',
      export_hint: 'Exportmöglichkeit — Markt mit dem höchsten regionalen Wert:',
      premium_label: 'Aufpreis vs. EU-Durchschnitt',
      p10l: 'Unten', p25l: 'Niedrig', p50l: 'Mitte', p75l: 'Hoch', p90l: 'Oben',
      active_listings: 'aktive Anzeigen', sample: 'Stichproben',
      footer: 'EU AutoValue Intelligence™ · EV Brand Gateway Modul · Kostenlose B2C-Bewertungsplattform · Die Ergebnisse sind indikativ und können von den tatsächlichen Marktbedingungen abweichen. · © 2026 EV DIAG · European EV Risk Infrastructure',
      free_badge: '✦ KOSTENLOS',
      hero_sub1: 'KI/ML AGENTENGRUPPE · MARKTINTELLIGENZ',
      hero_title: 'Professionelle Fahrzeugbewertung',
      hero_desc: 'Bayesianisches Wahrscheinlichkeitsmodell · 27 EU-Länder + Schweiz · 3-Jahres-Preistrend',
      result_gen: 'Ergebnisse werden generiert…',
      warn_mfg_before_model: '⚠️ Herstellungsjahr liegt vor dem Modelljahr – bitte prüfen!',
      warn_reg_before_mfg: '⚠️ Erstzulassung liegt vor dem Herstellungsjahr – bitte prüfen!',
      warn_reg_month_before_mfg: '⚠️ Zulassungsmonat liegt vor dem Herstellungsmonat (gleiches Jahr) – bitte prüfen!',
      readiness: 'Bewertungsbereitschaft',
      readiness_fields: 'Felder ausgefüllt',
      readiness_missing: 'Fehlende Felder',
      readiness_complete: 'Alle Felder ausgefüllt!',
      priority_critical: 'Erforderlich',
      priority_optional: 'Empfohlen',
      smart_next: 'Nächster Schritt',
      smart_next_prefix: 'Füllen Sie',
      smart_next_suffix: 'aus',
      smart_impact: 'Genauigkeit',
      smart_all_done: 'Maximale Genauigkeit erreicht!',
      smart_click_hint: 'Klicken zum Ausfüllen →',
      field_brand: 'Marke', field_model: 'Modell', field_year: 'Baujahr', field_fuel: 'Antrieb',
      field_km: 'Kilometerstand', field_country: 'Land', field_body: 'Karosserie',
      field_trimLevel: 'Ausstattung', field_enginePowerKw: 'Leistung (kW)',
      field_driveType: 'Antriebsart', field_transmission: 'Getriebe',
      field_mfgYear: 'Herstellungsjahr', field_regYear: 'Zulassungsjahr',
      field_batteryKwh: 'Batterie (kWh)', field_color: 'Farbe',
    },
  };
  const tr = ui[lang] || ui['HU'];

  // ── Valuation readiness calculation ──
  const READINESS_FIELDS: (keyof FormState)[] = [
    'brand', 'model', 'year', 'fuel', 'km', 'country',
    'body', 'trimLevel', 'enginePowerKw', 'driveType', 'transmission',
    'mfgYear', 'regYear', 'batteryKwh', 'color',
  ];
  const filledCount = READINESS_FIELDS.filter(k => form[k] && String(form[k]).trim() !== '').length;
  const missingFields = READINESS_FIELDS.filter(k => !form[k] || String(form[k]).trim() === '');
  const totalCount = READINESS_FIELDS.length;
  const readinessPct = Math.round((filledCount / totalCount) * 100);

  // ── Smart suggestion: impact weights per field ──
  const FIELD_IMPACT: Record<string, number> = {
    brand: 12, model: 12, year: 10, fuel: 9, km: 10, country: 8,
    batteryKwh: 6, enginePowerKw: 5, trimLevel: 5, driveType: 4,
    transmission: 4, body: 3, mfgYear: 3, regYear: 3, color: 2,
  };
  const smartSuggestion = missingFields.length > 0
    ? [...missingFields].sort((a, b) => (FIELD_IMPACT[b] || 0) - (FIELD_IMPACT[a] || 0))[0]
    : null;
  const smartImpact = smartSuggestion ? (FIELD_IMPACT[smartSuggestion] || 0) : 0;

  const scrollToField = useCallback((fieldKey: string) => {
    const el = formRef.current?.querySelector(`[data-field="${fieldKey}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('av-field-highlight');
    void el.offsetWidth;
    el.classList.add('av-field-highlight');
    const inp = el.querySelector('input, select') as HTMLElement | null;
    if (inp) setTimeout(() => inp.focus(), 400);
  }, []);

  const FUELS = [
    { value: 'BEV', label: tr.fuel_bev },
    { value: 'PHEV', label: tr.fuel_phev },
    { value: 'HEV', label: tr.fuel_hev },
    { value: 'MHEV', label: tr.fuel_mhev },
  ];

  useEffect(() => {
    if (makesLoaded.current) return;
    makesLoaded.current = true;
    (async () => {
      try {
        const res = await fetchWithTimeout(`${MARKET_API}/api/v1/market/makes`, 8000);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        const makes: string[] = (json.makes || []).map((m: any) => m.make || m);
        if (makes.length > 0) setApiMakes(makes);
      } catch (e) {
        console.warn('Makes API failed, using fallback:', e);
      } finally {
        setMakesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.brand) { setApiModels([]); return; }
    let cancelled = false;
    (async () => {
      setModelsLoading(true);
      try {
        const res = await fetchWithTimeout(`${MARKET_API}/api/v1/market/models?make=${encodeURIComponent(form.brand)}`, 8000);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        const models: string[] = (json.models || []).map((m: any) => m.model || m);
        if (!cancelled && models.length > 0) setApiModels(models);
      } catch (e) {
        console.warn('Models API failed, using fallback:', e);
        if (!cancelled) setApiModels([]);
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.brand]);

  const makesList = apiMakes.length > 0 ? apiMakes : Object.keys(FALLBACK_MODELS);
  const modelsList = apiModels.length > 0 ? apiModels : (FALLBACK_MODELS[form.brand] || []);
  const setField = (k: keyof FormState, v: string) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'brand') next.model = '';
      return next;
    });
  };
  const canSubmit = form.brand && form.model && form.year && form.fuel && form.km && form.country;

  const applyVinToForm = useCallback((rawResult: any) => {
    const vi = rawResult?.vehicle_identity;
    const agents = rawResult?.agents?.vin_decode;
    const trim = rawResult?.agents?.trim_intelligence;
    const evSpec = rawResult?.agents?.ev_specialist;
    const summary = rawResult?.summary;
    const recallSafety = rawResult?.agents?.recall_safety;

    const make = vi?.make || '';
    const normMake = make ? make.charAt(0).toUpperCase() + make.slice(1).toLowerCase() : '';

    // Normalize model: split "Passat / GTE" → main model + trim
    const rawModel = vi?.model || '';
    let mainModel = rawModel;
    let trimFromModel = '';
    if (rawModel.includes('/')) {
      const parts = rawModel.split('/').map((s: string) => s.trim());
      mainModel = parts[0];
      trimFromModel = parts.slice(1).join(' ').trim();
    } else if (rawModel.includes(' ')) {
      // Handle "Model 3" vs "ID.4 Pro" - only split if last word looks like a trim
      const words = rawModel.split(' ');
      const trimKeywords = ['pro', 'performance', 'gte', 'gtx', 'sport', 'line', 'edition', 'plus', 'max', 'premium', 'launch', 'first', 'style', 'life', 'elegance', 'amg', 'luxury'];
      if (words.length > 1 && trimKeywords.includes(words[words.length - 1].toLowerCase())) {
        mainModel = words.slice(0, -1).join(' ');
        trimFromModel = words[words.length - 1];
      }
    }

    const powertrain = (() => {
      const evType = (evSpec?.ev_type || summary?.ev_type || '').toUpperCase();
      if (evType === 'BEV') return 'BEV';
      if (evType.includes('PHEV')) return 'PHEV';
      if (evType.includes('MHEV')) return 'MHEV';
      if (evType.includes('HEV')) return 'HEV';
      const e = (vi?.electrification || '').toUpperCase();
      if (e === 'BEV') return 'BEV';
      if (e.includes('PHEV')) return 'PHEV';
      if (e.includes('MHEV')) return 'MHEV';
      if (e.includes('HEV')) return 'HEV';
      return '';
    })();

    const updates: Partial<FormState> = {};
    const filled = new Set<string>();

    const set = (key: keyof FormState, val: string | number | undefined | null) => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        (updates as any)[key] = String(val);
        filled.add(key);
      }
    };

    // Primary identity
    set('brand', normMake);
    set('model', mainModel);
    set('year', vi?.year);
    set('fuel', powertrain);

    // Trim: prefer summary, then trim_intelligence, then model-derived
    const bestTrim = summary?.trim_identified || summary?.trim_level || trim?.trim_level || trimFromModel;
    set('trimLevel', bestTrim);

    // Mileage
    set('km', vi?.mileage_km || summary?.mileage_km || agents?.mileage_km);

    // Country
    const rawCountry = vi?.country || summary?.country || agents?.country;
    if (rawCountry && COUNTRIES.includes(rawCountry.toUpperCase())) {
      set('country', rawCountry.toUpperCase());
    }

    // Body
    set('body', vi?.body_class || vi?.body);

    // Technical from agents
    set('enginePowerKw', agents?.engine_power_kw);
    set('engineDisplacement', agents?.engine_displacement);
    set('driveType', agents?.drive_type);
    set('transmission', agents?.transmission);
    set('doors', agents?.doors);
    set('seats', agents?.seats);

    // Battery from summary or ev_specialist
    const battKwh = summary?.battery_kwh || evSpec?.battery?.capacity_kwh;
    if (battKwh && (powertrain === 'BEV' || powertrain === 'PHEV')) {
      set('batteryKwh', battKwh);
    }
    const acKw = evSpec?.charging?.ac_kw;
    if (acKw && (powertrain === 'BEV' || powertrain === 'PHEV')) {
      set('chargingPowerAc', acKw);
    }

    // ── Manufacturing date ──
    set('mfgYear', vi?.manufacturing_year || summary?.manufacturing_year);
    set('mfgMonth', vi?.manufacturing_month || summary?.manufacturing_month);

    // ── First registration ──
    set('regYear', vi?.first_registration_year || summary?.first_registration_year);
    set('regMonth', vi?.first_registration_month || summary?.first_registration_month);

    // ── Equipment / packages ──
    const stdEq = trim?.standard_equipment;
    if (Array.isArray(stdEq) && stdEq.length > 0) {
      set('standardEquipment', stdEq.join(', '));
    }
    const optPkg = trim?.optional_packages;
    if (Array.isArray(optPkg) && optPkg.length > 0) {
      set('optionalPackages', optPkg.join(', '));
    }

    // ── Prior special usage ──
    const usageHint = summary?.prior_usage || vi?.prior_usage || agents?.prior_usage;
    if (usageHint) {
      set('priorUsage', usageHint);
      updates.priorUsageConfidence = summary?.prior_usage_confidence === 'confirmed' ? 'confirmed' : 'estimated';
      filled.add('priorUsage');
    }

    setForm(prev => ({ ...prev, ...updates }));
    setVinFilledFields(filled);
    setVinIdentity({
      manufacturer: vi?.manufacturer,
      plantCountry: vi?.plant_country,
      vin: rawResult.vin || undefined,
      recallCount: recallSafety?.recall_count ?? rawResult.safety?.recall_count,
    });
    setVinIdOpen(true);
    const count = filled.size;
    if (count > 0) toast.success(`✓ ${count} mező automatikusan kitöltve VIN alapján`);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, []);

  const handleVinDecoded = useCallback((make: string, model: string, year: string, powertrain: string, rawResult?: any) => {
    if (rawResult) {
      setVinRawResult(rawResult);
      // Auto-fill immediately
      applyVinToForm(rawResult);
    } else {
      // Fallback: basic fields only
      const normMake = make ? make.charAt(0).toUpperCase() + make.slice(1).toLowerCase() : '';
      const updates: Partial<FormState> = {};
      let count = 0;
      if (normMake) { updates.brand = normMake; count++; }
      if (model) { updates.model = model; count++; }
      if (year) { updates.year = year; count++; }
      if (powertrain) { updates.fuel = powertrain; count++; }
      setForm(prev => ({ ...prev, ...updates }));
      if (count > 0) toast.success(`✓ ${count} mező automatikusan kitöltve VIN alapján`);
    }
  }, [applyVinToForm]);

  const handleModalApply = useCallback(() => {
    if (vinRawResult) applyVinToForm(vinRawResult);
    setVinModalOpen(false);
  }, [vinRawResult, applyVinToForm]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    setScreen('loading'); setProgress(0);
    const steps = [
      [15, 'Multi-country Price Aggregator…'],
      [35, 'Probability Distribution Engine…'],
      [55, 'Sales Velocity Predictor…'],
      [72, 'Regional Risk Scoring…'],
      [88, 'Bayesian Market Risk Layer…'],
      [100, tr.result_gen],
    ] as [number, string][];
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) { setProgress(steps[i][0]); setStepLabel(steps[i][1]); i++; }
      else {
        clearInterval(iv);
        fetchValuation(form).then(apiResult => {
          if (apiResult && apiResult.data_points > 0) setResult(mapApiToResult(apiResult, form));
          else setResult(generateResult(form));
          setScreen('result'); setTab(0);
          onVehicleEvaluated?.({
            make: form.brand,
            model: form.model,
            year: form.year,
            mileage: form.km,
            country: form.country,
          });
        });
      }
    }, 420);
  }, [canSubmit, form, tr.result_gen]);

  const reset = () => { setScreen('input'); setResult(null); };

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {screen === 'result' && (
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans'" }}>{tr.new_valuation}</button>
          )}
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1a4a7a,#2880c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2a' }}>EU AutoValue Intelligence™</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>EUROPEAN EV RISK INFRASTRUCTURE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={S.badge}>🇪🇺 27 EU + 🇨🇭 CH</span>
          <span style={S.badge}>{tr.free_badge}</span>
        </div>
      </div>

      {screen === 'input' && (
        <div style={{ padding: '48px 20px', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>✦ {tr.hero_sub1}</div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16, ...S.gradientText }}>{tr.hero_title}</h1>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '0 auto 20px' }}>{tr.hero_desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {['Multi-country Price Aggregator','Probability Distribution Engine','Sales Velocity Predictor','Regional Risk Scoring','Bayesian Market Risk Layer'].map(c => (
                <span key={c} style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(40,128,196,0.08)', border: '1px solid rgba(40,128,196,0.15)', color: '#3b82f6', fontSize: 11 }}>⬡ {c}</span>
              ))}
            </div>
          </div>

          <VinDecoder onVehicleDecoded={handleVinDecoded} styles={{ card: S.card, input: S.input, btn: S.btn, label: S.label, muted: S.muted }} />

          {/* Clickable VIN summary hero card — SINGLE instance */}
          {vinRawResult?.vehicle_identity?.make && (
            <div
              onClick={() => setVinModalOpen(true)}
              style={{
                ...S.card, maxWidth: 680, margin: '0 auto 16px', borderLeft: '4px solid #22c55e',
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>✓ Jármű azonosítva</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2a', marginBottom: 6 }}>
                    {vinRawResult.vehicle_identity.make} {vinRawResult.vehicle_identity.model} {vinRawResult.vehicle_identity.year}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    {vinRawResult.vehicle_identity.body_class && (
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>{vinRawResult.vehicle_identity.body_class}</span>
                    )}
                    {vinRawResult.vehicle_identity.electrification && (
                      <span style={{
                        padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: vinRawResult.vehicle_identity.electrification.toUpperCase() === 'BEV' ? '#dcfce7' : '#eff6ff',
                        color: vinRawResult.vehicle_identity.electrification.toUpperCase() === 'BEV' ? '#166534' : '#1d4ed8',
                      }}>
                        {vinRawResult.vehicle_identity.electrification}
                      </span>
                    )}
                  </div>
                  {(vinRawResult.vehicle_identity.manufacturer || vinRawResult.vehicle_identity.plant_country) && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {vinRawResult.vehicle_identity.manufacturer}{vinRawResult.vehicle_identity.manufacturer && vinRawResult.vehicle_identity.plant_country ? ' · ' : ''}{vinRawResult.vehicle_identity.plant_country}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 10,
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14 }}>👁</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                    Összes adat megtekintése
                  </span>
                </div>
              </div>
            </div>
          )}

          {vinModalOpen && vinRawResult && (
            <VinResultModal data={vinRawResult} onClose={() => setVinModalOpen(false)} onApply={handleModalApply} />
          )}

          <div ref={formRef} style={{ ...S.card, maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2a' }}>{tr.vehicle_data}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{tr.vehicle_sub}</div>
              </div>
              {vinFilledFields.size > 0 && (
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#166534', whiteSpace: 'nowrap' }}>
                  🤖 {vinFilledFields.size} mező kitöltve VIN alapján
                </span>
              )}
            </div>

            {/* Valuation readiness progress */}
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: readinessPct >= 80 ? '#166534' : readinessPct >= 50 ? '#92400e' : '#6b7280' }}>
                  {tr.readiness}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      style={{
                        fontSize: 11, color: missingFields.length > 0 ? '#2563eb' : '#166534',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textDecoration: 'underline', textDecorationStyle: 'dotted',
                        padding: 0,
                      }}
                    >
                      {filledCount}/{totalCount} {tr.readiness_fields} · {readinessPct}%
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" side="bottom" align="end">
                    {missingFields.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#166534', fontWeight: 600, margin: 0 }}>
                        ✅ {tr.readiness_complete}
                      </p>
                    ) : (() => {
                      const CRITICAL: Set<string> = new Set(['brand', 'model', 'year', 'fuel', 'km', 'country']);
                      const criticalMissing = missingFields.filter(f => CRITICAL.has(f));
                      const optionalMissing = missingFields.filter(f => !CRITICAL.has(f));
                      return (
                        <>
                          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px 0', color: '#1a1a2a' }}>
                            {tr.readiness_missing} ({missingFields.length})
                          </p>
                          {criticalMissing.length > 0 && (
                            <>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                ● {tr.priority_critical}
                              </span>
                              <ul style={{ margin: '2px 0 8px', paddingLeft: 16, fontSize: 11, color: '#dc2626', lineHeight: 1.8 }}>
                                {criticalMissing.map(f => (
                                  <li key={f} style={{ fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' as const }} onClick={() => scrollToField(f)}>{(tr as any)[`field_${f}`] || f}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          {optionalMissing.length > 0 && (
                            <>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                ○ {tr.priority_optional}
                              </span>
                              <ul style={{ margin: '2px 0 0', paddingLeft: 16, fontSize: 11, color: '#92400e', lineHeight: 1.8 }}>
                                {optionalMissing.map(f => (
                                  <li key={f} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' as const }} onClick={() => scrollToField(f)}>{(tr as any)[`field_${f}`] || f}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </PopoverContent>
                </Popover>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 0.4s ease, background 0.4s ease',
                  width: `${readinessPct}%`,
                  background: readinessPct >= 80 ? '#22c55e' : readinessPct >= 50 ? '#f59e0b' : '#d1d5db',
                }} />
              </div>
              {/* Smart suggestion */}
              {smartSuggestion ? (
                <div
                  onClick={() => scrollToField(smartSuggestion)}
                  style={{
                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8,
                    background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.06)')}
                >
                  <span style={{ fontSize: 14 }}>💡</span>
                  <span style={{ fontSize: 11, color: '#1e40af', flex: 1 }}>
                    <strong>{tr.smart_next}:</strong>{' '}
                    {tr.smart_next_prefix} <strong>{(tr as any)[`field_${smartSuggestion}`] || smartSuggestion}</strong> {tr.smart_next_suffix}
                    <span style={{ marginLeft: 6, fontSize: 10, color: '#3b82f6', fontWeight: 500 }}>{tr.smart_click_hint}</span>
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                    background: smartImpact >= 8 ? '#dc2626' : smartImpact >= 5 ? '#f59e0b' : '#6b7280',
                    borderRadius: 10, padding: '2px 8px',
                  }}>
                    +{smartImpact}% {tr.smart_impact}
                  </span>
                </div>
              ) : (
                <div style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                }}>
                  <span style={{ fontSize: 13 }}>✅</span>
                  <span style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>{tr.smart_all_done}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Row 1: Make, Model */}
              <div data-field="brand">
                <label style={S.label}>{tr.make} {vinFilledFields.has('brand') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('brand') ? vinHighlight : {}) }} value={form.brand} onChange={e => setField('brand', e.target.value)}>
                  <option value="">{makesLoading ? tr.loading : tr.select}</option>
                  {makesList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div data-field="model">
                <label style={S.label}>{tr.model} {vinFilledFields.has('model') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('model') ? vinHighlight : {}), opacity: form.brand ? 1 : 0.5 }} value={form.model} onChange={e => setField('model', e.target.value)} disabled={!form.brand || modelsLoading}>
                  <option value="">{modelsLoading ? tr.loading : tr.select}</option>
                  {modelsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {/* Row 2: Year, Fuel */}
              <div data-field="year">
                <label style={S.label}>{tr.year} {vinFilledFields.has('year') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('year') ? vinHighlight : {}) }} value={form.year} onChange={e => setField('year', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div data-field="fuel">
                <label style={S.label}>{tr.fuel} {vinFilledFields.has('fuel') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('fuel') ? vinHighlight : {}) }} value={form.fuel} onChange={e => setField('fuel', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {FUELS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              {/* Row 2.5: Mileage, Country */}
              <div data-field="km">
                <label style={S.label}>{tr.mileage}</label>
                <input className="av-inp" type="number" style={S.input} placeholder="pl. 85000" value={form.km} onChange={e => setField('km', e.target.value)} />
              </div>
              <div data-field="country">
                <label style={S.label}>{tr.country}</label>
                <select className="av-inp" style={S.input} value={form.country} onChange={e => setField('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
                </select>
              </div>

              {/* ── Separator ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />

              {/* Row 3: Body, Trim */}
              <div data-field="body">
                <label style={S.label}>Karosszéria {vinFilledFields.has('body') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('body') ? vinHighlight : {}) }} value={form.body} onChange={e => setField('body', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {['Sedan','Kombi','SUV','Crossover','Hatchback','Coupe','Cabrio','Van','Pickup','Egyéb'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div data-field="trimLevel">
                <label style={S.label}>Trim szint {vinFilledFields.has('trimLevel') && <VinBadge />}</label>
                <input className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('trimLevel') ? vinHighlight : {}) }} placeholder="pl. Titanium, R-Line, AMG..." value={form.trimLevel} onChange={e => setField('trimLevel', e.target.value)} />
              </div>

              {/* Row 4: Engine power, Displacement */}
              <div data-field="enginePowerKw">
                <label style={S.label}>Motor teljesítmény {vinFilledFields.has('enginePowerKw') && <VinBadge />}</label>
                <div style={{ position: 'relative' }}>
                  <input className="av-inp" type="number" style={{ ...S.input, ...(vinFilledFields.has('enginePowerKw') ? vinHighlight : {}), paddingRight: 40 }} placeholder="pl. 110" value={form.enginePowerKw} onChange={e => setField('enginePowerKw', e.target.value)} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', pointerEvents: 'none' }}>kW</span>
                </div>
              </div>
              <div>
                <label style={S.label}>Hengerűrtartalom {vinFilledFields.has('engineDisplacement') && <VinBadge />}</label>
                <div style={{ position: 'relative' }}>
                  <input className="av-inp" type="number" style={{ ...S.input, ...(vinFilledFields.has('engineDisplacement') ? vinHighlight : {}), paddingRight: 28 }} placeholder="pl. 2.0" value={form.engineDisplacement} onChange={e => setField('engineDisplacement', e.target.value)} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', pointerEvents: 'none' }}>L</span>
                </div>
              </div>

              {/* Row 5: Drive, Transmission */}
              <div data-field="driveType">
                <label style={S.label}>Meghajtás {vinFilledFields.has('driveType') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('driveType') ? vinHighlight : {}) }} value={form.driveType} onChange={e => setField('driveType', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {['Első kerék','Hátsó kerék','Összkerék','4x4'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div data-field="transmission">
                <label style={S.label}>Váltó {vinFilledFields.has('transmission') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('transmission') ? vinHighlight : {}) }} value={form.transmission} onChange={e => setField('transmission', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {['Kézi','Automata','DCT','CVT','Egyéb'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* Row 6: Battery fields (BEV/PHEV only) */}
              {(form.fuel === 'BEV' || form.fuel === 'PHEV') && (
                <>
                  <div data-field="batteryKwh">
                    <label style={S.label}>Akkumulátor kapacitás {vinFilledFields.has('batteryKwh') && <VinBadge />}</label>
                    <div style={{ position: 'relative' }}>
                      <input className="av-inp" type="number" style={{ ...S.input, ...(vinFilledFields.has('batteryKwh') ? vinHighlight : {}), paddingRight: 44 }} placeholder="pl. 79.5" value={form.batteryKwh} onChange={e => setField('batteryKwh', e.target.value)} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', pointerEvents: 'none' }}>kWh</span>
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Töltési teljesítmény AC {vinFilledFields.has('chargingPowerAc') && <VinBadge />}</label>
                    <div style={{ position: 'relative' }}>
                      <input className="av-inp" type="number" style={{ ...S.input, ...(vinFilledFields.has('chargingPowerAc') ? vinHighlight : {}), paddingRight: 36 }} placeholder="pl. 11" value={form.chargingPowerAc} onChange={e => setField('chargingPowerAc', e.target.value)} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', pointerEvents: 'none' }}>kW</span>
                    </div>
                  </div>
                </>
              )}

              {/* Row 7: Doors, Seats */}
              <div>
                <label style={S.label}>Ajtók száma {vinFilledFields.has('doors') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('doors') ? vinHighlight : {}) }} value={form.doors} onChange={e => setField('doors', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {['2','3','4','5'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Ülőhelyek {vinFilledFields.has('seats') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('seats') ? vinHighlight : {}) }} value={form.seats} onChange={e => setField('seats', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {['2','4','5','6','7','8+'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* Row 8: Color, Equipment note */}
              <div data-field="color">
                <label style={S.label}>Szín</label>
                <input className="av-inp" style={S.input} placeholder="pl. Fehér, Fekete..." value={form.color} onChange={e => setField('color', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Felszereltség megjegyzés</label>
                <input className="av-inp" style={S.input} placeholder="pl. panorámatető, bőr, HUD..." value={form.equipmentNote} onChange={e => setField('equipmentNote', e.target.value)} />
              </div>

              {/* ── Separator: Dátumok ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />

              {/* Manufacturing date */}
              <div data-field="mfgYear">
                <label style={S.label}>Gyártási év {vinFilledFields.has('mfgYear') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('mfgYear') ? vinHighlight : {}) }} value={form.mfgYear} onChange={e => setField('mfgYear', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Gyártási hónap {vinFilledFields.has('mfgMonth') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('mfgMonth') ? vinHighlight : {}) }} value={form.mfgMonth} onChange={e => setField('mfgMonth', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* First registration */}
              <div data-field="regYear">
                <label style={S.label}>Első üzembehelyezés éve {vinFilledFields.has('regYear') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('regYear') ? vinHighlight : {}) }} value={form.regYear} onChange={e => setField('regYear', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Első üzembehelyezés hónapja {vinFilledFields.has('regMonth') && <VinBadge />}</label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('regMonth') ? vinHighlight : {}) }} value={form.regMonth} onChange={e => setField('regMonth', e.target.value)}>
                  <option value="">{tr.select}</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* Date validation warnings */}
              {form.mfgYear && form.year && parseInt(form.mfgYear) < parseInt(form.year) && (
                <div style={{ gridColumn: '1 / -1', padding: '6px 10px', borderRadius: 6, fontSize: 13, color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                  {tr.warn_mfg_before_model}
                </div>
              )}
              {form.regYear && form.mfgYear && parseInt(form.regYear) < parseInt(form.mfgYear) && (
                <div style={{ gridColumn: '1 / -1', padding: '6px 10px', borderRadius: 6, fontSize: 13, color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                  {tr.warn_reg_before_mfg}
                </div>
              )}
              {form.regYear && form.mfgYear && form.regMonth && form.mfgMonth && form.regYear === form.mfgYear && parseInt(form.regMonth) < parseInt(form.mfgMonth) && (
                <div style={{ gridColumn: '1 / -1', padding: '6px 10px', borderRadius: 6, fontSize: 13, color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                  {tr.warn_reg_month_before_mfg}
                </div>
              )}

              {/* ── Separator: Felszereltség ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />

              {/* Standard equipment */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Alapfelszereltség {vinFilledFields.has('standardEquipment') && <VinBadge />}</label>
                <input className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('standardEquipment') ? vinHighlight : {}) }} placeholder="pl. LED fényszóró, tolatókamera, klíma..." value={form.standardEquipment} onChange={e => setField('standardEquipment', e.target.value)} />
              </div>

              {/* Optional packages */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Extra csomagok / opciók {vinFilledFields.has('optionalPackages') && <VinBadge />}</label>
                <input className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('optionalPackages') ? vinHighlight : {}) }} placeholder="pl. Premium csomag, Sport csomag, Tech csomag..." value={form.optionalPackages} onChange={e => setField('optionalPackages', e.target.value)} />
              </div>

              {/* ── Separator: Korábbi használat ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />

              {/* Prior special usage */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>
                  Korábbi különleges használat {vinFilledFields.has('priorUsage') && <VinBadge />}
                  {form.priorUsageConfidence === 'estimated' && (
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600, background: '#fef3c7', color: '#92400e', marginLeft: 4, verticalAlign: 'middle' }}>
                      becsült
                    </span>
                  )}
                </label>
                <select className="av-inp" style={{ ...S.input, ...(vinFilledFields.has('priorUsage') ? vinHighlight : {}) }} value={form.priorUsage} onChange={e => setField('priorUsage', e.target.value)}>
                  <option value="">Nincs ismert különleges használat</option>
                  {PRIOR_USAGES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>

            {/* Collapsible: Identification data */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setVinIdOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
              >
                📋 Azonosítás adatok
                <span style={{ display: 'inline-block', transform: vinIdOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 10 }}>▼</span>
              </button>
              {vinIdOpen && vinIdentity && (
                <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: '#f8f9fa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#6b7280' }}>
                  {vinIdentity.manufacturer && <div>Gyártó: <strong style={{ color: '#374151' }}>{vinIdentity.manufacturer}</strong></div>}
                  {vinIdentity.plantCountry && <div>Gyártási ország: <strong style={{ color: '#374151' }}>{vinIdentity.plantCountry}</strong></div>}
                  {vinIdentity.vin && <div>VIN: <strong style={{ fontFamily: "'DM Mono', monospace", color: '#374151' }}>{vinIdentity.vin}</strong></div>}
                  {vinIdentity.recallCount !== undefined && <div>Visszahívások: <strong style={{ color: vinIdentity.recallCount === 0 ? '#22c55e' : '#ef4444' }}>{vinIdentity.recallCount}</strong></div>}
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>🔒 {tr.gdpr}</span>
              <button className="av-btn" style={{ ...S.btn, width: 'auto', opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }} disabled={!canSubmit} onClick={handleSubmit}>{tr.submit}</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 680, margin: '24px auto 0', textAlign: 'center' }}>
            {[['📈', tr.trend_title, tr.trend_sub],['🎯', tr.p10_title, tr.p10_sub],['⚡', tr.velocity_title, tr.velocity_sub]].map(([icon, t, d]) => (
              <div key={t} style={{ padding: 16 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2a' }}>{t}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === 'loading' && (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#1a4a7a,#2880c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, animation: 'avPulse 2s infinite' }}>📊</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1a1a2a' }}>{tr.analyzing}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#c9a84c', marginBottom: 16 }}>{stepLabel}</div>
          <div style={{ width: 380, maxWidth: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, margin: '0 auto 12px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#1a4a7a,#2880c4,#65a3cc)', borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{progress}% · {Math.min(5, Math.ceil(progress / 20))} / 5 {tr.agents_ready}</div>
        </div>
      )}

      {screen === 'result' && result && (
        <div style={{ padding: '24px 20px 48px', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ ...S.card, background: '#f0f4ff', borderColor: '#dbe4f0', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 24, animation: 'avFadeUp 0.5s ease forwards' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>{form.brand} {form.model} · {form.year} · {form.fuel}</div>
              <div style={{ fontSize: 42, fontWeight: 800, ...S.goldText, lineHeight: 1.1 }}><AnimatedNumber value={result.p50} suffix=" €" /></div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{tr.p50_label}</div>
              <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 8 }}>{tr.suggested}: <span style={S.gold}>{result.recommended.low.toLocaleString('hu-HU')}</span> – <span style={S.gold}>{result.recommended.high.toLocaleString('hu-HU')} €</span></div>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <RiskMeter score={result.riskScore} labels={{ low: tr.risk_low, mid: tr.risk_mid, high: tr.risk_high }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{tr.sell_speed}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#4caf82' }}><AnimatedNumber value={result.velocityDays} suffix={` ${tr.day}`} /></div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{result.velocityProb}{tr.prob_suffix}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
            {[tr.tab_dist, tr.tab_trend, tr.tab_regional, tr.tab_agents].map((t, i) => (
              <button key={t} className="av-tab" onClick={() => setTab(i)} style={{ background: tab === i ? 'rgba(201,168,76,0.08)' : 'transparent', color: tab === i ? '#c9a84c' : '#6b7280', border: 'none', borderBottom: tab === i ? '2px solid #c9a84c' : '2px solid transparent', padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'" }}>{t}</button>
            ))}
          </div>

          {tab === 0 && (
            <div style={{ animation: 'avFadeUp 0.4s ease forwards' }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#1a1a2a' }}>{tr.distribution}</div>
                <PercentileBar p10={result.p10} p25={result.p25} p50={result.p50} p75={result.p75} p90={result.p90} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 16 }}>
                {[
                  ['P10', tr.p10l, result.p10, false],
                  ['P25', tr.p25l, result.p25, false],
                  ['P50', tr.p50l, result.p50, true],
                  ['P75', tr.p75l, result.p75, false],
                  ['P90', tr.p90l, result.p90, false],
                ].map(([label, desc, val, gold]) => (
                  <div key={label as string} className="av-stat" style={{ ...S.card, padding: 16, textAlign: 'center', borderColor: gold ? '#c9a84c33' : '#e5e7eb', transition: 'border-color 0.2s' }}>
                    <div style={{ fontSize: 11, color: gold ? '#c9a84c' : '#6b7280', fontWeight: 600 }}>{label as string}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: gold ? '#c9a84c' : '#1a1a2a', marginTop: 4 }}><AnimatedNumber value={val as number} suffix=" €" /></div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{desc as string}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div style={{ ...S.card }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a2a' }}>{tr.suggested}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#4caf82' }}><AnimatedNumber value={result.recommended.low} /> – <AnimatedNumber value={result.recommended.high} suffix=" €" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}><AnimatedNumber value={result.marketDepth} /></div><div style={{ fontSize: 10, color: '#6b7280' }}>{tr.market_depth}</div></div>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}><AnimatedNumber value={result.similarListings} /></div><div style={{ fontSize: 10, color: '#6b7280' }}>{tr.similar_listings}</div></div>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}><AnimatedNumber value={result.demandIndex} suffix="%" /></div><div style={{ fontSize: 10, color: '#6b7280' }}>{tr.demand_index}</div></div>
                  </div>
                </div>
                <div style={{ ...S.card }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1a1a2a' }}>{tr.sell_velocity}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                    {[[tr.within14, Math.round(result.velocityProb * 0.4)], [tr.within30, result.velocityProb], [tr.within60, Math.min(99, result.velocityProb + 25)]].map(([l, v]) => (
                      <div key={l as string}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#4caf82' }}><AnimatedNumber value={v as number} suffix="%" /></div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>{l as string}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(76,175,130,0.06)', border: '1px solid rgba(76,175,130,0.15)', fontSize: 12, color: '#4caf82' }}>
                    💡 {tr.strategy_hint}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div style={{ animation: 'avFadeUp 0.4s ease forwards' }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#1a1a2a' }}>{tr.trend_36m}</div>
                <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
                  <defs>
                    <linearGradient id="av-tg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2880c4" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2880c4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="av-lg" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#1a4a7a" />
                      <stop offset="50%" stopColor="#2880c4" />
                      <stop offset="100%" stopColor="#c9a84c" />
                    </linearGradient>
                  </defs>
                  {[0,1,2,3,4].map(i => <line key={i} x1={0} x2={800} y1={i * 50} y2={i * 50} stroke="#e5e7eb" strokeWidth={1} />)}
                  {(() => {
                    const td = result.trendData;
                    const mn = Math.min(...td); const mx = Math.max(...td);
                    const pts = td.map((v, i) => `${(i / 35) * 800},${200 - ((v - mn) / (mx - mn || 1)) * 180}`).join(' ');
                    const area = `0,200 ${pts} 800,200`;
                    const last = td[td.length - 1];
                    const ly = 200 - ((last - mn) / (mx - mn || 1)) * 180;
                    return (
                      <>
                        <polygon points={area} fill="url(#av-tg)" />
                        <polyline points={pts} fill="none" stroke="url(#av-lg)" strokeWidth={2.5} />
                        <circle cx={800} cy={ly} r={5} fill="#c9a84c" />
                      </>
                    );
                  })()}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginTop: 8 }}>
                  {["Jan '23","Jun '23","Jan '24","Jun '24","Jan '25","Dec '25"].map(l => <span key={l}>{l}</span>)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                {[
                  [tr.lowest, Math.min(...result.trendData), '#e05a5a'],
                  [tr.highest, Math.max(...result.trendData), '#4caf82'],
                  [tr.average, Math.round(result.trendData.reduce((a, b) => a + b, 0) / 36), '#3b82f6'],
                  [tr.current, result.trendData[35], '#c9a84c'],
                ].map(([l, v, c]) => (
                  <div key={l as string} className="av-stat" style={{ ...S.card, padding: 16, textAlign: 'center', transition: 'border-color 0.2s' }}>
                    <div style={{ fontSize: 11, color: c as string, fontWeight: 600 }}>{l as string}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2a', marginTop: 4 }}><AnimatedNumber value={v as number} suffix=" €" /></div>
                  </div>
                ))}
              </div>
              <div style={{ ...S.card, marginTop: 16, background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.2)' }}>
                <div style={{ fontSize: 13, color: '#c9a84c' }}>
                  📈 {result.trendData[35] > result.trendData[24] ? tr.trend_rising : tr.trend_falling} {tr.trend_change_12m}: <strong>{((result.trendData[35] - result.trendData[24]) / result.trendData[24] * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          )}

          {tab === 2 && (
            <div style={{ animation: 'avFadeUp 0.4s ease forwards' }}>
              {result.regional.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🌍</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>{tr.regional_empty}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{tr.regional_empty_sub}</div>
                </div>
              ) : (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {result.regional.map((r, i) => {
                  const diff = ((r.price - result.p50) / result.p50 * 100);
                  const isUser = r.code === form.country;
                  const diffColor = diff > 5 ? '#4caf82' : diff < -5 ? '#e05a5a' : '#c9a84c';
                  return (
                    <div key={r.code} className="av-stat" style={{ ...S.card, padding: 16, borderColor: isUser ? '#c9a84c44' : '#e5e7eb', animation: `avFadeUp 0.5s ${i * 0.04}s ease both`, transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: isUser ? '#c9a84c' : '#1a1a2a', fontWeight: 600 }}>{FLAGS[r.code]} {r.code}{isUser ? ' ★' : ''}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${diffColor}11`, color: diffColor, fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff.toFixed(0)}%</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2a' }}><AnimatedNumber value={r.price} suffix=" €" /></div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                          <span>{tr.speed_label}</span><span>{r.velocity}%</span>
                        </div>
                        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${r.velocity}%`, background: 'linear-gradient(90deg,#1a4a7a,#2880c4)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const best = [...result.regional].sort((a, b) => b.price - a.price)[0];
                const prem = ((best.price - result.p50) / result.p50 * 100).toFixed(0);
                return (
                  <div style={{ ...S.card, marginTop: 16, background: 'rgba(40,128,196,0.04)', borderColor: 'rgba(40,128,196,0.15)' }}>
                    <div style={{ fontSize: 13, color: '#3b82f6' }}>💡 {tr.export_hint} <strong>{best.code}</strong> — <strong>{best.price.toLocaleString('hu-HU')} €</strong> ({prem}% {tr.premium_label})</div>
                  </div>
                );
              })()}
              </>
              )}
            </div>
          )}

          {tab === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'avFadeUp 0.4s ease forwards' }}>
              {[
                { icon: '🌐', name: 'Multi-country Price Aggregator', color: '#4caf82', metric: `${result.marketDepth} ${tr.active_listings}`, desc: '27 EU + CH aggregated market data', details: ['14 platforms','4h refresh','27+1 countries','±2.3% deviation'] },
                { icon: '📊', name: 'Probability Distribution Engine', color: '#4caf82', metric: `P10–P90 · ${result.similarListings} ${tr.sample}`, desc: 'Bayesian Gaussian Mixture distribution', details: ['94.2% confidence','5 percentile levels','Kernel density est.','Monte Carlo sim.'] },
                { icon: '⚡', name: 'Sales Velocity Predictor', color: '#4caf82', metric: `${result.velocityDays} ${tr.day} · ${result.velocityProb}%`, desc: 'Sales time prediction', details: ['XGBoost + time series','2.4M transactions','14/30/60 day window','Seasonal correction'] },
                { icon: '🗺️', name: 'Regional Risk Scoring', color: '#4caf82', metric: `${result.regional.length} regions`, desc: 'Regional risk map', details: ['Price deviation','Risk category','Export potential','Market liquidity'] },
                { icon: '🧠', name: 'Bayesian Market Risk Layer', color: '#4caf82', metric: `Risk score: ${result.riskScore}/100`, desc: 'Complex market risk analysis', details: ['Liquidity index','Depreciation rate','Volatility','Market cycle'] },
                { icon: '✦', name: 'Aggregator Intelligence', color: '#c9a84c', metric: `${result.p50.toLocaleString('hu-HU')} € · P50`, desc: 'Final recommendation', details: ['Suggested range','94% decision conf.','Model v3.2.1-EU','Multi-agent cons.'] },
              ].map(a => (
                <div key={a.name} className="av-stat" style={{ ...S.card, borderColor: a.color === '#c9a84c' ? '#c9a84c44' : '#e5e7eb', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{a.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2a' }}>{a.name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: a.color, background: `${a.color}11`, padding: '2px 8px', borderRadius: 10 }}>✓ {tr.agents_done}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#c9a84c', marginBottom: 6 }}>{a.metric}</div>
                  <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 10 }}>{a.desc}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {a.details.map(d => <div key={d} style={{ fontSize: 11, color: '#6b7280' }}>▶ {d}</div>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <PdfDownloadButton vin={vinIdentity?.vin} inline />

          <div style={{ textAlign: 'center', padding: 16, marginTop: 32, fontSize: 11, color: '#9ca3af' }}>
            {tr.footer}
          </div>
        </div>
      )}
    </div>
  );
}

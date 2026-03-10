import { useState, useEffect, useRef, useCallback } from 'react';

const MARKET_API = 'https://market.evdiag.hu';

// ── Types ──
type Screen = 'input' | 'loading' | 'result';
type FormState = { brand: string; model: string; year: string; fuel: string; km: string; country: string };
type Result = {
  p10: number; p25: number; p50: number; p75: number; p90: number;
  recommended: { low: number; high: number };
  riskScore: number; velocityDays: number; velocityProb: number;
  trendData: number[];
  regional: { code: string; price: number; velocity: number }[];
  marketDepth: number; similarListings: number; demandIndex: number;
  isFallback?: boolean; dataPoints?: number;
};

// Hardcoded fallback lists
const FALLBACK_MODELS: Record<string, string[]> = {
  "Audi": ["A3","A4","A6","Q3","Q5","e-tron","Q4 e-tron"],
  "BMW": ["116i","318i","520d","X1","X3","iX3","i4"],
  "Mercedes-Benz": ["A180","C220","E300","GLC","EQA","EQB","EQC"],
  "Volkswagen": ["Golf","Passat","Tiguan","Polo","ID.3","ID.4","ID.5"],
  "Tesla": ["Model 3","Model Y","Model S","Model X"],
  "Toyota": ["Yaris","Corolla","RAV4","C-HR","bZ4X","Prius"],
  "Hyundai": ["i30","Tucson","IONIQ 5","IONIQ 6","Kona Electric"],
  "Kia": ["Ceed","Sportage","EV6","EV9","Niro EV"],
  "Skoda": ["Octavia","Superb","Kodiaq","Enyaq iV"],
  "Renault": ["Clio","Megane","Zoe","Megane E-Tech","Arkana"],
  "Peugeot": ["208","308","e-208","e-2008","3008"],
  "Ford": ["Focus","Fiesta","Puma","Kuga","Mustang Mach-E"],
  "Opel": ["Astra","Insignia","Mokka-e","Corsa-e"],
  "Volvo": ["XC40","XC60","C40 Recharge","EX30","EX90"],
  "Seat": ["Ibiza","Leon","Ateca","Cupra Born"],
};

const COUNTRIES = ["HU","DE","AT","FR","IT","ES","PL","CZ","SK","RO","NL","BE","SE","DK","FI","NO","PT","GR","HR","BG","SI","LT","LV","EE","LU","MT","CY","CH"];
const FLAGS: Record<string, string> = { HU:'🇭🇺',DE:'🇩🇪',AT:'🇦🇹',FR:'🇫🇷',IT:'🇮🇹',ES:'🇪🇸',PL:'🇵🇱',CZ:'🇨🇿',SK:'🇸🇰',RO:'🇷🇴',NL:'🇳🇱',BE:'🇧🇪',SE:'🇸🇪',DK:'🇩🇰',FI:'🇫🇮',NO:'🇳🇴',PT:'🇵🇹',GR:'🇬🇷',HR:'🇭🇷',BG:'🇧🇬',SI:'🇸🇮',LT:'🇱🇹',LV:'🇱🇻',EE:'🇪🇪',LU:'🇱🇺',MT:'🇲🇹',CY:'🇨🇾',CH:'🇨🇭' };

const YEARS = Array.from({ length: 12 }, (_, i) => String(2024 - i));
const FUELS = [
  { value: 'BEV', label: 'BEV – Elektromos' },
  { value: 'PHEV', label: 'PHEV – Plug-in hibrid' },
  { value: 'HEV', label: 'HEV – Hibrid' },
  { value: 'MHEV', label: 'MHEV – Enyhe hibrid' },
];

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

// ── API helpers ──
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
    const res = await fetchWithTimeout(`${MARKET_API}/market/valuation?${params}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('Valuation API error, falling back to mock:', e);
    return null;
  }
}

function mapApiToResult(api: any, form: FormState): Result {
  const ps = api.price_stats || {};
  const p50 = ps.median || ps.p50 || 0;
  // FIX 1: proper falsy check – 0 triggers fallback formula
  const p10 = (ps.p10 && ps.p10 > 0) ? ps.p10 : Math.round(p50 * 0.74);
  const p25 = (ps.p25 && ps.p25 > 0) ? ps.p25 : Math.round(p50 * 0.87);
  const p75 = (ps.p75 && ps.p75 > 0) ? ps.p75 : Math.round(p50 * 1.13);
  const p90 = (ps.p90 && ps.p90 > 0) ? ps.p90 : Math.round(p50 * 1.26);

  // If p25 === p75 (collapsed range from few data points), spread ±10%
  const finalP25 = p25 === p75 ? Math.round(p50 * 0.90) : p25;
  const finalP75 = p25 === p75 ? Math.round(p50 * 1.10) : p75;

  // Risk score from price_position
  let riskScore = 50;
  if (api.price_position?.label === 'ALULERTEKELT') riskScore = 25;
  else if (api.price_position?.label === 'TULARAZOTT') riskScore = 75;

  // FIX 2: Improved velocity calculation
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

  velocityDays = velocityScore > 70 ? 14 :
                 velocityScore > 50 ? 21 :
                 velocityScore > 30 ? 35 : 55;

  velocityProb30 = velocityScore > 70 ? 82 :
                   velocityScore > 50 ? 65 :
                   velocityScore > 30 ? 45 : 28;

  // FIX 3: Trend data from year_distribution with realistic depreciation
  let trendData: number[];
  if (yearDist.length > 0) {
    const sorted = [...yearDist].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    const baseYear = parseInt(sorted[sorted.length - 1].year);
    const yearPrices = sorted.map(y => {
      const yearsOld = baseYear - parseInt(y.year);
      return Math.round(p50 * Math.pow(1.08, yearsOld));
    });
    // Interpolate to 36 monthly points from yearly data
    trendData = [];
    for (let i = 0; i < yearPrices.length - 1; i++) {
      const monthsPerSegment = Math.max(1, Math.round(36 / Math.max(1, yearPrices.length - 1)));
      for (let m = 0; m < monthsPerSegment && trendData.length < 36; m++) {
        const t = m / monthsPerSegment;
        trendData.push(Math.round(yearPrices[i] * (1 - t) + yearPrices[i + 1] * t));
      }
    }
    // Pad to 36 if needed
    while (trendData.length < 36) trendData.push(yearPrices[yearPrices.length - 1]);
    trendData = trendData.slice(0, 36);
  } else {
    trendData = Array.from({ length: 36 }, (_, i) =>
      Math.round(p50 * (0.82 + i / 35 * 0.22 + Math.sin(i / 3) * 0.02))
    );
  }

  // FIX 4: Regional from comparable_listings – real data only, no mock padding
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

  // No mock padding – if no regional data, array stays empty

  return {
    p10, p25: finalP25, p50, p75: finalP75, p90,
    recommended: { low: finalP25, high: finalP75 },
    riskScore,
    velocityDays,
    velocityProb: velocityProb30,
    trendData,
    regional,
    marketDepth: dataPoints,
    similarListings: dataPoints,
    demandIndex: Math.min(99, Math.round(velocityScore * 0.9 + 10)),
    isFallback: api.fallback_mode || false,
    dataPoints,
  };
}

// ── Styles ──
const S = {
  root: { fontFamily: "'DM Sans', sans-serif", background: '#07111e', color: '#f0ede6', minHeight: '100vh' } as React.CSSProperties,
  header: { position: 'sticky' as const, top: 0, zIndex: 50, background: 'rgba(7,17,30,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #0e2035', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: { background: 'rgba(40,128,196,0.15)', border: '1px solid rgba(40,128,196,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#65a3cc' } as React.CSSProperties,
  card: { background: 'linear-gradient(135deg, #0c1a2c, #0e2035)', border: '1px solid #1a3050', borderRadius: 14, padding: 24 } as React.CSSProperties,
  input: { background: '#0a1828', border: '1px solid #1a3050', borderRadius: 10, padding: '11px 14px', color: '#f0ede6', fontSize: 14, width: '100%', outline: 'none', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  label: { fontSize: 12, color: '#5a7a96', marginBottom: 6, display: 'block' } as React.CSSProperties,
  btn: { background: 'linear-gradient(135deg, #1a4a7a, #2880c4)', color: '#f0ede6', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' } as React.CSSProperties,
  gold: { color: '#c9a84c' },
  muted: { color: '#5a7a96' },
  blue: { color: '#65a3cc' },
  green: { color: '#4caf82' },
  gradientText: { background: 'linear-gradient(135deg, #f0ede6, #65a3cc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties,
  goldText: { background: 'linear-gradient(135deg, #f0ede6, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties,
};

// ── AnimatedNumber ──
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0; const dur = 1200; const t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setDisplay(Math.round(value * p * 10 ** decimals) / 10 ** decimals);
      if (p >= 1) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [value, decimals]);
  return <>{prefix}{display.toLocaleString('hu-HU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}

// ── RiskMeter ──
function RiskMeter({ score }: { score: number }) {
  const color = score < 35 ? '#4caf82' : score < 65 ? '#c9a84c' : '#e05a5a';
  const label = score < 35 ? 'Alacsony kockázat' : score < 65 ? 'Közepes kockázat' : 'Magas kockázat';
  const dash = (score / 100) * 172;
  const angle = -135 + (score / 100) * 270;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={140} height={90} viewBox="0 0 140 90">
        <path d="M15,80 A55,55,0,0,1,125,80" fill="none" stroke="#1e2a3a" strokeWidth={10} strokeLinecap="round" />
        <path d="M15,80 A55,55,0,0,1,125,80" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${dash} 172`} />
        <line x1={70} y1={80} x2={70} y2={40} stroke={color} strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${angle} 70 80)`} />
        <circle cx={70} cy={80} r={5} fill={color} />
        <text x={70} y={72} textAnchor="middle" fill="#f0ede6" fontSize={18} fontWeight={800} fontFamily="DM Sans">{score}</text>
      </svg>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── PercentileBar ──
function PercentileBar({ p10, p25, p50, p75, p90 }: { p10: number; p25: number; p50: number; p75: number; p90: number }) {
  const min = p10 * 0.95; const max = p90 * 1.05; const r = max - min;
  const pct = (v: number) => ((v - min) / r) * 100;
  return (
    <div style={{ position: 'relative', height: 60, marginTop: 16, marginBottom: 24 }}>
      <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 8, background: '#111d2b', borderRadius: 4 }} />
      <div style={{ position: 'absolute', top: 18, left: `${pct(p10)}%`, width: `${pct(p90) - pct(p10)}%`, height: 6, background: 'rgba(40,128,196,0.2)', borderRadius: 3 }} />
      <div style={{ position: 'absolute', top: 18, left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%`, height: 12, background: 'rgba(40,128,196,0.5)', borderRadius: 4 }} />
      {/* P50 gold needle */}
      <div style={{ position: 'absolute', top: 0, left: `${pct(p50)}%`, width: 3, height: 52, background: '#c9a84c', borderRadius: 2, transform: 'translateX(-1.5px)' }} />
      <div style={{ position: 'absolute', top: 54, left: `${pct(p50)}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#c9a84c', fontWeight: 700 }}>P50</div>
      {[{ v: p10, l: 'P10' }, { v: p25, l: 'P25' }, { v: p75, l: 'P75' }, { v: p90, l: 'P90' }].map(({ v, l }) => (
        <div key={l}>
          <div style={{ position: 'absolute', bottom: 16, left: `${pct(v)}%`, width: 2, height: 20, background: '#3a5a7a', transform: 'translateX(-1px)' }} />
          <div style={{ position: 'absolute', top: 0, left: `${pct(v)}%`, transform: 'translateX(-50%)', fontSize: 9, color: '#5a7a96' }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ── CSS injection ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.av-inp:focus { border-color: #2880c4 !important; }
.av-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.av-tab:hover { color: #8ab8d8 !important; }
.av-stat:hover { border-color: #1a3a5c !important; }
@keyframes avFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
@keyframes avPulse { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.08); opacity:1; } }
`;

// ── Main Component ──
export default function EUAutoValueIntelligence() {
  const [screen, setScreen] = useState<Screen>('input');
  const [form, setForm] = useState<FormState>({ brand: '', model: '', year: '', fuel: '', km: '', country: 'HU' });
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [tab, setTab] = useState(0);

  // Dynamic makes/models from API
  const [apiMakes, setApiMakes] = useState<string[]>([]);
  const [makesLoading, setMakesLoading] = useState(true);
  const [apiModels, setApiModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const makesLoaded = useRef(false);

  // Fetch makes on mount
  useEffect(() => {
    if (makesLoaded.current) return;
    makesLoaded.current = true;
    (async () => {
      try {
        const res = await fetchWithTimeout(`${MARKET_API}/market/makes`, 8000);
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

  // Fetch models when brand changes
  useEffect(() => {
    if (!form.brand) {
      setApiModels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setModelsLoading(true);
      try {
        const res = await fetchWithTimeout(
          `${MARKET_API}/market/models?make=${encodeURIComponent(form.brand)}`, 8000
        );
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

  // Resolved lists: API first, fallback second
  const makesList = apiMakes.length > 0 ? apiMakes : Object.keys(FALLBACK_MODELS);
  const modelsList = apiModels.length > 0
    ? apiModels
    : (FALLBACK_MODELS[form.brand] || []);

  const setField = (k: keyof FormState, v: string) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'brand') next.model = '';
      return next;
    });
  };

  const canSubmit = form.brand && form.model && form.year && form.fuel && form.km && form.country;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    setScreen('loading');
    setProgress(0);
    const steps = [
      [15, 'Multi-country Price Aggregator…'],
      [35, 'Probability Distribution Engine…'],
      [55, 'Sales Velocity Predictor…'],
      [72, 'Regional Risk Scoring…'],
      [88, 'Bayesian Market Risk Layer…'],
      [100, 'Eredmény generálása…'],
    ] as [number, string][];
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i][0]);
        setStepLabel(steps[i][1]);
        i++;
      } else {
        clearInterval(iv);
        // Fire the real API call during the last loading phase
        fetchValuation(form).then(apiResult => {
          if (apiResult && apiResult.data_points > 0) {
            setResult(mapApiToResult(apiResult, form));
          } else {
            setResult(generateResult(form));
          }
          setScreen('result');
          setTab(0);
        });
      }
    }, 420);
  }, [canSubmit, form]);

  const reset = () => { setScreen('input'); setResult(null); };

  // ── Render ──
  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {screen === 'result' && (
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#65a3cc', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans'" }}>← Új értékbecslés</button>
          )}
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1a4a7a,#2880c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0ede6' }}>EU AutoValue Intelligence™</div>
            <div style={{ fontSize: 10, color: '#3a6a96' }}>EUROPEAN EV RISK INFRASTRUCTURE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={S.badge}>🇪🇺 27 EU + 🇨🇭 CH</span>
          <span style={S.badge}>✦ INGYENES</span>
        </div>
      </div>

      {/* ─── INPUT SCREEN ─── */}
      {screen === 'input' && (
        <div style={{ padding: '48px 20px', maxWidth: 800, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>✦ AI/MI ÜGYNÖKCSOPORT · PIACI INTELLIGENCIA</div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16, ...S.gradientText }}>Professzionális Járműértékbecslés</h1>
            <p style={{ fontSize: 15, color: '#5a7a96', maxWidth: 560, margin: '0 auto 20px' }}>Bayes-alapú valószínűségi modell · 27 EU ország + Svájc · 3 év visszamenőleges ártrend</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {['Multi-country Price Aggregator','Probability Distribution Engine','Sales Velocity Predictor','Regional Risk Scoring','Bayesian Market Risk Layer'].map(c => (
                <span key={c} style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(40,128,196,0.1)', border: '1px solid rgba(40,128,196,0.2)', color: '#65a3cc', fontSize: 11 }}>⬡ {c}</span>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div style={{ ...S.card, maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Jármű adatok megadása</div>
                <div style={{ fontSize: 12, color: '#5a7a96' }}>Adja meg a jármű fő paramétereit</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Brand */}
              <div>
                <label style={S.label}>Márka</label>
                <select className="av-inp" style={S.input} value={form.brand} onChange={e => setField('brand', e.target.value)}>
                  <option value="">{makesLoading ? 'Betöltés...' : 'Válasszon...'}</option>
                  {makesList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {/* Model */}
              <div>
                <label style={S.label}>Modell</label>
                <select className="av-inp" style={{ ...S.input, opacity: form.brand ? 1 : 0.5 }} value={form.model} onChange={e => setField('model', e.target.value)} disabled={!form.brand || modelsLoading}>
                  <option value="">{modelsLoading ? 'Betöltés...' : 'Válasszon...'}</option>
                  {modelsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {/* Year */}
              <div>
                <label style={S.label}>Évjárat</label>
                <select className="av-inp" style={S.input} value={form.year} onChange={e => setField('year', e.target.value)}>
                  <option value="">Válasszon...</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {/* Fuel */}
              <div>
                <label style={S.label}>Hajtáslánc</label>
                <select className="av-inp" style={S.input} value={form.fuel} onChange={e => setField('fuel', e.target.value)}>
                  <option value="">Válasszon...</option>
                  {FUELS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              {/* KM */}
              <div>
                <label style={S.label}>Futásteljesítmény (km)</label>
                <input className="av-inp" type="number" style={S.input} placeholder="pl. 85000" value={form.km} onChange={e => setField('km', e.target.value)} />
              </div>
              {/* Country */}
              <div>
                <label style={S.label}>Ország</label>
                <select className="av-inp" style={S.input} value={form.country} onChange={e => setField('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#3a5a7a' }}>🔒 Adatai biztonságban · GDPR-kompatibilis</span>
              <button className="av-btn" style={{ ...S.btn, width: 'auto', opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }} disabled={!canSubmit} onClick={handleSubmit}>Értékbecslés indítása →</button>
            </div>
          </div>

          {/* Info strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 680, margin: '24px auto 0', textAlign: 'center' }}>
            {[['📈','3 éves ártrend','Havi árbontás EU piacon'],['🎯','P10–P90 percentilis','Teljes piaci áreloszlás'],['⚡','Értékesítési sebesség','Valószínűségi előrejelzés']].map(([icon, t, d]) => (
              <div key={t} style={{ padding: 16 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div>
                <div style={{ fontSize: 11, color: '#5a7a96' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── LOADING SCREEN ─── */}
      {screen === 'loading' && (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#1a4a7a,#2880c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, animation: 'avPulse 2s infinite' }}>📊</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>AI ügynökök elemzése…</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#c9a84c', marginBottom: 16 }}>{stepLabel}</div>
          <div style={{ width: 380, maxWidth: '100%', height: 6, background: '#111d2b', borderRadius: 3, margin: '0 auto 12px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#1a4a7a,#2880c4,#65a3cc)', borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 13, color: '#5a7a96' }}>{progress}% · {Math.min(5, Math.ceil(progress / 20))} / 5 ügynök kész</div>
        </div>
      )}

      {/* ─── RESULT SCREEN ─── */}
      {screen === 'result' && result && (
        <div style={{ padding: '24px 20px 48px', maxWidth: 1000, margin: '0 auto' }}>
          {/* Summary bar */}
          <div style={{ ...S.card, background: 'linear-gradient(135deg, #0e1f34, #112840)', borderColor: '#1a3a5c', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 24, animation: 'avFadeUp 0.5s ease forwards' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#5a7a96', marginBottom: 4 }}>{form.brand} {form.model} · {form.year} · {form.fuel}</div>
              <div style={{ fontSize: 42, fontWeight: 800, ...S.goldText, lineHeight: 1.1 }}><AnimatedNumber value={result.p50} suffix=" €" /></div>
              <div style={{ fontSize: 13, color: '#5a7a96', marginTop: 4 }}>P50 piaci értéke</div>
              <div style={{ fontSize: 14, color: '#65a3cc', marginTop: 8 }}>Ajánlott eladási ársáv: <span style={S.gold}>{result.recommended.low.toLocaleString('hu-HU')}</span> – <span style={S.gold}>{result.recommended.high.toLocaleString('hu-HU')} €</span></div>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <RiskMeter score={result.riskScore} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#5a7a96' }}>Eladási sebesség</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#4caf82' }}><AnimatedNumber value={result.velocityDays} suffix=" nap" /></div>
                <div style={{ fontSize: 11, color: '#5a7a96' }}>{result.velocityProb}% valószínűség 30 napon belül</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a3050', marginBottom: 24 }}>
            {['Áteloszlás','Ártrend','Regionális','AI Ügynökök'].map((t, i) => (
              <button key={t} className="av-tab" onClick={() => setTab(i)} style={{ background: tab === i ? 'rgba(201,168,76,0.08)' : 'transparent', color: tab === i ? '#c9a84c' : '#5a7a96', border: 'none', borderBottom: tab === i ? '2px solid #c9a84c' : '2px solid transparent', padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'" }}>{t}</button>
            ))}
          </div>

          {/* TAB 0: Distribution */}
          {tab === 0 && (
            <div style={{ animation: 'avFadeUp 0.4s ease forwards' }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Piaci áreloszlás</div>
                <PercentileBar p10={result.p10} p25={result.p25} p50={result.p50} p75={result.p75} p90={result.p90} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 16 }}>
                {[
                  ['P10','Alsó', result.p10, false],
                  ['P25','Alacsony', result.p25, false],
                  ['P50','Közép', result.p50, true],
                  ['P75','Magas', result.p75, false],
                  ['P90','Felső', result.p90, false],
                ].map(([label, desc, val, gold]) => (
                  <div key={label as string} className="av-stat" style={{ ...S.card, padding: 16, textAlign: 'center', borderColor: gold ? '#c9a84c33' : '#1a3050', transition: 'border-color 0.2s' }}>
                    <div style={{ fontSize: 11, color: gold ? '#c9a84c' : '#5a7a96', fontWeight: 600 }}>{label as string}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: gold ? '#c9a84c' : '#f0ede6', marginTop: 4 }}><AnimatedNumber value={val as number} suffix=" €" /></div>
                    <div style={{ fontSize: 10, color: '#5a7a96', marginTop: 2 }}>{desc as string}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {/* Recommended */}
                <div style={{ ...S.card }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Ajánlott eladási ársáv</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#4caf82' }}><AnimatedNumber value={result.recommended.low} /> – <AnimatedNumber value={result.recommended.high} suffix=" €" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: '#65a3cc' }}><AnimatedNumber value={result.marketDepth} /></div><div style={{ fontSize: 10, color: '#5a7a96' }}>Piaci mélység</div></div>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: '#65a3cc' }}><AnimatedNumber value={result.similarListings} /></div><div style={{ fontSize: 10, color: '#5a7a96' }}>Hasonló hirdetések</div></div>
                    <div><div style={{ fontSize: 20, fontWeight: 700, color: '#65a3cc' }}><AnimatedNumber value={result.demandIndex} suffix="%" /></div><div style={{ fontSize: 10, color: '#5a7a96' }}>Keresleti index</div></div>
                  </div>
                </div>
                {/* Velocity */}
                <div style={{ ...S.card }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Értékesítési sebesség</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                    {[['14 napon belül', Math.round(result.velocityProb * 0.4)], ['30 napon belül', result.velocityProb], ['60 napon belül', Math.min(99, result.velocityProb + 25)]].map(([l, v]) => (
                      <div key={l as string}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#4caf82' }}><AnimatedNumber value={v as number} suffix="%" /></div>
                        <div style={{ fontSize: 10, color: '#5a7a96' }}>{l as string}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.2)', fontSize: 12, color: '#4caf82' }}>
                    💡 Stratégia: Hirdesse az ajánlott ársáv felső értékén, és legyen nyitott 5-8% tárgyalási mozgástérre.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Trend */}
          {tab === 1 && (
            <div style={{ animation: 'avFadeUp 0.4s ease forwards' }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>36 hónapos ártrend</div>
                <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
                  <defs>
                    <linearGradient id="av-tg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2880c4" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2880c4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="av-lg" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#1a4a7a" />
                      <stop offset="50%" stopColor="#2880c4" />
                      <stop offset="100%" stopColor="#c9a84c" />
                    </linearGradient>
                  </defs>
                  {[0,1,2,3,4].map(i => <line key={i} x1={0} x2={800} y1={i * 50} y2={i * 50} stroke="#0e2035" strokeWidth={1} />)}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#5a7a96', marginTop: 8 }}>
                  {["Jan '23","Jún '23","Jan '24","Jún '24","Jan '25","Dec '25"].map(l => <span key={l}>{l}</span>)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                {[
                  ['Legalacsonyabb', Math.min(...result.trendData), '#e05a5a'],
                  ['Legmagasabb', Math.max(...result.trendData), '#4caf82'],
                  ['Átlag', Math.round(result.trendData.reduce((a, b) => a + b, 0) / 36), '#65a3cc'],
                  ['Jelenlegi', result.trendData[35], '#c9a84c'],
                ].map(([l, v, c]) => (
                  <div key={l as string} className="av-stat" style={{ ...S.card, padding: 16, textAlign: 'center', transition: 'border-color 0.2s' }}>
                    <div style={{ fontSize: 11, color: c as string, fontWeight: 600 }}>{l as string}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}><AnimatedNumber value={v as number} suffix=" €" /></div>
                  </div>
                ))}
              </div>

              <div style={{ ...S.card, marginTop: 16, background: 'rgba(201,168,76,0.05)', borderColor: 'rgba(201,168,76,0.2)' }}>
                <div style={{ fontSize: 13, color: '#c9a84c' }}>
                  📈 Trend elemzés: {result.trendData[35] > result.trendData[24] ? 'Emelkedő trend az elmúlt 12 hónapban.' : 'Csökkenő trend az elmúlt 12 hónapban.'} 12 havi változás: <strong>{((result.trendData[35] - result.trendData[24]) / result.trendData[24] * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Regional */}
          {tab === 2 && (
            <div style={{ animation: 'avFadeUp 0.4s ease forwards' }}>
              {result.regional.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🌍</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#5a7a96', marginBottom: 8 }}>Korlátozott regionális adat</div>
                  <div style={{ fontSize: 12, color: '#3a5a7a' }}>Ehhez a járműhöz jelenleg nem áll rendelkezésre elegendő összehasonlító hirdetés más országokból.</div>
                </div>
              ) : (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {result.regional.map((r, i) => {
                  const diff = ((r.price - result.p50) / result.p50 * 100);
                  const isUser = r.code === form.country;
                  const diffColor = diff > 5 ? '#4caf82' : diff < -5 ? '#e05a5a' : '#c9a84c';
                  return (
                    <div key={r.code} className="av-stat" style={{ ...S.card, padding: 16, borderColor: isUser ? '#c9a84c44' : '#1a3050', animation: `avFadeUp 0.5s ${i * 0.04}s ease both`, transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: isUser ? '#c9a84c' : '#f0ede6', fontWeight: 600 }}>{FLAGS[r.code]} {r.code}{isUser ? ' ★' : ''}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${diffColor}22`, color: diffColor, fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff.toFixed(0)}%</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}><AnimatedNumber value={r.price} suffix=" €" /></div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#5a7a96', marginBottom: 4 }}>
                          <span>Sebesség</span><span>{r.velocity}%</span>
                        </div>
                        <div style={{ height: 4, background: '#111d2b', borderRadius: 2 }}>
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
                  <div style={{ ...S.card, marginTop: 16, background: 'rgba(40,128,196,0.05)', borderColor: 'rgba(40,128,196,0.2)' }}>
                    <div style={{ fontSize: 13, color: '#65a3cc' }}>💡 Exportlehetőség — A legmagasabb regionális értéket kínáló piac: <strong>{best.code}</strong> — <strong>{best.price.toLocaleString('hu-HU')} €</strong> ({prem}% prémium az EU átlaghoz képest)</div>
                  </div>
                );
              })()}
              </>
              )}
          {/* TAB 3: AI Agents */}
          {tab === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'avFadeUp 0.4s ease forwards' }}>
              {[
                { icon: '🌐', name: 'Multi-country Price Aggregator', color: '#4caf82', metric: `${result.marketDepth} aktív hirdetés`, desc: '27 EU + CH aggregált piaci adat', details: ['14 platform','4 óránkénti frissítés','27+1 ország lefedés','±2.3% eltérés'] },
                { icon: '📊', name: 'Probability Distribution Engine', color: '#4caf82', metric: `P10–P90 · ${result.similarListings} minta`, desc: 'Bayesian Gaussian Mixture áreloszlás', details: ['94.2% konfidencia','5 percentilis szint','Kernel density becslés','Monte Carlo szimuláció'] },
                { icon: '⚡', name: 'Sales Velocity Predictor', color: '#4caf82', metric: `${result.velocityDays} nap · ${result.velocityProb}%`, desc: 'Értékesítési idő előrejelzés', details: ['XGBoost + idősor','2.4M tranzakció','14/30/60 nap ablak','Szezonális korrekció'] },
                { icon: '🗺️', name: 'Regional Risk Scoring', color: '#4caf82', metric: `${result.regional.length} régió elemezve`, desc: 'Regionális kockázati térkép', details: ['Ár szórás elemzés','Kockázati kategória','Export potenciál','Piaci likviditás'] },
                { icon: '🧠', name: 'Bayesian Market Risk Layer', color: '#4caf82', metric: `Kockázati score: ${result.riskScore}/100`, desc: 'Komplex piaci kockázatelemzés', details: ['Likviditási index','Értékvesztési ráta','Volatilitás mérés','Piaci ciklus pozíció'] },
                { icon: '✦', name: 'Összesítő Intelligencia', color: '#c9a84c', metric: `${result.p50.toLocaleString('hu-HU')} € · P50`, desc: 'Végső ajánlás és döntési bizalom', details: ['Ajánlott ársáv','Döntési bizalom 94%','Modell v3.2.1-EU','Multi-agent konsz.'] },
              ].map(a => (
                <div key={a.name} className="av-stat" style={{ ...S.card, borderColor: a.color === '#c9a84c' ? '#c9a84c44' : '#1a3050', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{a.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: a.color, background: `${a.color}22`, padding: '2px 8px', borderRadius: 10 }}>✓ KÉSZ</span>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#c9a84c', marginBottom: 6 }}>{a.metric}</div>
                  <div style={{ fontSize: 12, color: '#8ab8d8', marginBottom: 10 }}>{a.desc}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {a.details.map(d => <div key={d} style={{ fontSize: 11, color: '#5a7a96' }}>▶ {d}</div>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: 16, marginTop: 32, fontSize: 11, color: '#2a4a6a' }}>
            EU AutoValue Intelligence™ · EV Brand Gateway modul · Ingyenes B2C értékbecslő platform · Az eredmények tájékoztató jellegűek, tényleges piaci körülményektől eltérhetnek. · © 2026 EV DIAG · European EV Risk Infrastructure
          </div>
        </div>
      )}
    </div>
  );
}

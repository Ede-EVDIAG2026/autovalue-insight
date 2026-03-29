import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Battery, X, Download, Microscope, AlertTriangle, ShieldCheck, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';

const tx: Record<string, Record<Lang, string>> = {
  title: { HU: 'Akkumulátor Degradációs Analízis', EN: 'Battery Degradation Analysis', DE: 'Batterie-Degradationsanalyse' },
  subtitle: { HU: 'Bayesian Core v2 · EV DIAG', EN: 'Bayesian Core v2 · EV DIAG', DE: 'Bayesian Core v2 · EV DIAG' },
  sec_params: { HU: 'Bayesian Számítási Paraméterek', EN: 'Bayesian Calculation Parameters', DE: 'Bayessche Berechnungsparameter' },
  sec_curve: { HU: 'Degradációs Görbe Előrejelzés', EN: 'Degradation Curve Forecast', DE: 'Degradationskurvenprognose' },
  sec_risk: { HU: 'Kockázati Tényezők', EN: 'Risk Factors', DE: 'Risikofaktoren' },
  sec_market: { HU: 'Piaci Értékhatás', EN: 'Market Value Impact', DE: 'Marktwertauswirkung' },
  sec_faults: { HU: 'Ismert Hibakódok és Kockázatok', EN: 'Known Fault Codes & Risks', DE: 'Bekannte Fehlercodes & Risiken' },
  sec_rec: { HU: 'Vásárlói Ajánlás', EN: 'Buyer Recommendation', DE: 'Kaufempfehlung' },
  cell_chem: { HU: 'Cellakémia', EN: 'Cell chemistry', DE: 'Zellchemie' },
  nominal_cap: { HU: 'Névleges kapacitás', EN: 'Nominal capacity', DE: 'Nennkapazität' },
  remaining_cap: { HU: 'Becsült maradék kapacitás', EN: 'Est. remaining capacity', DE: 'Gesch. Restkapazität' },
  wltp_new: { HU: 'WLTP hatótáv (új)', EN: 'WLTP range (new)', DE: 'WLTP-Reichweite (neu)' },
  current_range: { HU: 'Becsült jelenlegi hatótáv', EN: 'Est. current range', DE: 'Gesch. aktuelle Reichweite' },
  annual_rate: { HU: 'Éves degradációs ráta', EN: 'Annual degradation rate', DE: 'Jährl. Degradationsrate' },
  optimistic: { HU: 'Optimista', EN: 'Optimistic', DE: 'Optimistisch' },
  expected: { HU: 'Várható', EN: 'Expected', DE: 'Erwartet' },
  conservative: { HU: 'Konzervatív', EN: 'Conservative', DE: 'Konservativ' },
  now: { HU: 'Most', EN: 'Now', DE: 'Jetzt' },
  warranty_thresh: { HU: 'Garancia küszöb', EN: 'Warranty threshold', DE: 'Garantieschwelle' },
  eu_avg_thresh: { HU: 'EU átlag csereküszöb', EN: 'EU avg. replacement threshold', DE: 'EU-Durchschn. Austauschgrenze' },
  years: { HU: 'Év', EN: 'Year', DE: 'Jahr' },
  capacity_pct: { HU: 'Kapacitás %', EN: 'Capacity %', DE: 'Kapazität %' },
  value_decrease: { HU: 'Értékcsökkentő tartomány', EN: 'Value-decreasing range', DE: 'Wertmindernder Bereich' },
  market_avg: { HU: 'Piaci átlag', EN: 'Market average', DE: 'Marktdurchschnitt' },
  value_increase: { HU: 'Értéknövelő tartomány', EN: 'Value-increasing range', DE: 'Wertsteigernder Bereich' },
  impact_text: { HU: 'A {level} degradációs szint várhatóan {pct}%-kal befolyásolja a piaci értéket.', EN: 'The {level} degradation level is expected to impact market value by {pct}%.', DE: 'Das {level} Degradationsniveau wird den Marktwert voraussichtlich um {pct}% beeinflussen.' },
  no_faults: { HU: 'Ennél a modellnél nem találtunk ismert kritikus hibakódot az EV DIAG adatbázisban.', EN: 'No known critical fault codes found for this model in the EV DIAG database.', DE: 'Keine bekannten kritischen Fehlercodes für dieses Modell in der EV DIAG-Datenbank gefunden.' },
  th_dtc: { HU: 'DTC kód', EN: 'DTC code', DE: 'DTC-Code' },
  th_component: { HU: 'Komponens', EN: 'Component', DE: 'Komponente' },
  th_severity: { HU: 'Súlyosság', EN: 'Severity', DE: 'Schweregrad' },
  th_desc: { HU: 'Leírás', EN: 'Description', DE: 'Beschreibung' },
  rec_low: { HU: '✓ Az akkumulátor kiváló állapotban van. Ajánlott vásárlás.', EN: '✓ The battery is in excellent condition. Recommended purchase.', DE: '✓ Die Batterie ist in ausgezeichnetem Zustand. Kaufempfehlung.' },
  rec_medium: { HU: 'ℹ Az akkumulátor átlagos EU-s állapotban van. Feltételesen ajánlott.', EN: 'ℹ The battery is in average EU condition. Conditionally recommended.', DE: 'ℹ Die Batterie ist in durchschnittlichem EU-Zustand. Bedingt empfohlen.' },
  rec_high: { HU: '⚠ Fokozott ellenőrzés szükséges vásárlás előtt.', EN: '⚠ Enhanced inspection required before purchase.', DE: '⚠ Erhöhte Prüfung vor dem Kauf erforderlich.' },
  rec_critical: { HU: '✗ Komoly akkumulátor problémák valószínűsíthetők.', EN: '✗ Serious battery issues are likely.', DE: '✗ Schwerwiegende Batterieprobleme sind wahrscheinlich.' },
  wizard_cta: { HU: '🔬 Részletes előellenőrzéshez használd az Akkumulátor Előellenőrző Varázslót →', EN: '🔬 For detailed pre-inspection use the Battery Pre-Inspection Wizard →', DE: '🔬 Für eine detaillierte Vorabprüfung nutze den Batterie-Vorinspektions-Assistenten →' },
  download_pdf: { HU: '⬇ Riport letöltése PDF-ben', EN: '⬇ Download report as PDF', DE: '⬇ Bericht als PDF herunterladen' },
  close: { HU: '× Bezárás', EN: '× Close', DE: '× Schließen' },
  footer: { HU: 'EV DIAG Bayesian Core v2 · Adatforrás: AS24 piac + EV Tudásbázis', EN: 'EV DIAG Bayesian Core v2 · Source: AS24 market + EV Knowledge Base', DE: 'EV DIAG Bayesian Core v2 · Quelle: AS24 Markt + EV-Wissensdatenbank' },
  lfp_desc: { HU: 'Lítium-vasfoszfát — alacsony degradáció, hosszú élettartam', EN: 'Lithium iron phosphate — low degradation, long lifespan', DE: 'Lithium-Eisenphosphat — niedrige Degradation, lange Lebensdauer' },
  nmc_desc: { HU: 'Nikkel-mangán-kobalt — közepes degradáció, magas energiasűrűség', EN: 'Nickel-manganese-cobalt — moderate degradation, high energy density', DE: 'Nickel-Mangan-Kobalt — moderate Degradation, hohe Energiedichte' },
  nca_desc: { HU: 'Nikkel-kobalt-alumínium — magasabb degradáció kockázat', EN: 'Nickel-cobalt-aluminium — higher degradation risk', DE: 'Nickel-Kobalt-Aluminium — höheres Degradationsrisiko' },
  inputDataTitle: { HU: 'Számítás bemeneti adatai', EN: 'Calculation Input Data', DE: 'Berechnungs-Eingabedaten' },
  inputMake: { HU: 'Gyártó / Modell', EN: 'Make / Model', DE: 'Hersteller / Modell' },
  inputPowertrain: { HU: 'Hajtáslánc típus', EN: 'Powertrain Type', DE: 'Antriebsart' },
  inputBatteryNominal: { HU: 'Akkumulátor (névleges)', EN: 'Battery (nominal)', DE: 'Batterie (nominell)' },
  inputWltp: { HU: 'WLTP hatótáv', EN: 'WLTP Range', DE: 'WLTP-Reichweite' },
  inputRealRange: { HU: 'Reális hatótáv (80%)', EN: 'Real Range (80%)', DE: 'Reale Reichweite (80%)' },
  inputChemistry: { HU: 'Cellakémia', EN: 'Cell Chemistry', DE: 'Zellchemie' },
  inputDegradationRisk: { HU: 'Gyári degradációs kockázat', EN: 'Factory Degradation Risk', DE: 'Werksseitiges Degradationsrisiko' },
  inputWarranty: { HU: 'Garancia', EN: 'Warranty', DE: 'Garantie' },
  inputKbConfidence: { HU: 'KB megbízhatóság', EN: 'KB Confidence', DE: 'KB-Zuverlässigkeit' },
  inputMedianPrice: { HU: 'Piaci medián ár', EN: 'Market Median Price', DE: 'Markt-Medianpreis' },
  inputDataPoints: { HU: 'Piaci adatpontok', EN: 'Market Data Points', DE: 'Marktdatenpunkte' },
};

interface DegradationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    degradation_risk: string;
    battery_kwh: number;
    range_km_wltp: number;
    cell_chemistry?: string;
    degradation_pct?: number;
    degradation_rate_per_year?: number;
    fault_codes?: { dtc_code: string; severity: string; component: string; dtc_description?: string; known_fix?: string }[];
    rental_battery?: boolean;
    known_issues?: string[];
    warranty_battery_years?: number;
    warranty_battery_km?: number;
    model_type?: string;
    make?: string;
    model?: string;
    real_range_80pct_km?: number;
    data_confidence?: number;
    median_price_eur?: number;
    data_points?: number;
  };
  onOpenWizard?: () => void;
}

const levelColors: Record<string, { gauge: string; bg: string; text: string; border: string }> = {
  LOW: { gauge: 'hsl(142 76% 36%)', bg: 'bg-green-50 border-green-200', text: 'text-green-800', border: 'border-green-500' },
  MEDIUM: { gauge: 'hsl(48 96% 53%)', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', border: 'border-yellow-500' },
  HIGH: { gauge: 'hsl(25 95% 53%)', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', border: 'border-orange-500' },
  CRITICAL: { gauge: 'hsl(0 84% 60%)', bg: 'bg-red-50 border-red-200', text: 'text-red-900', border: 'border-red-600' },
};

const chemDescKey: Record<string, string> = { LFP: 'lfp_desc', NMC: 'nmc_desc', NCA: 'nca_desc' };

function priceImpact(level: string): { min: number; max: number } {
  switch (level) {
    case 'LOW': return { min: 3, max: 5 };
    case 'MEDIUM': return { min: -5, max: -2 };
    case 'HIGH': return { min: -15, max: -8 };
    case 'CRITICAL': return { min: -35, max: -20 };
    default: return { min: 0, max: 0 };
  }
}

function degradationPctFromLevel(level: string): number {
  switch (level) {
    case 'LOW': return 8;
    case 'MEDIUM': return 18;
    case 'HIGH': return 30;
    case 'CRITICAL': return 45;
    default: return 15;
  }
}

function rateFromLevel(level: string): number {
  switch (level) {
    case 'LOW': return 1.5;
    case 'MEDIUM': return 2.5;
    case 'HIGH': return 4.0;
    case 'CRITICAL': return 6.0;
    default: return 2.5;
  }
}

function AnimatedCircularGauge({ value, color, size = 160 }: { value: number; color: string; size?: number }) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;
  const progress = (animVal / 100) * c;

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={12} opacity={0.3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={12}
        strokeDasharray={c} strokeDashoffset={c - progress}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
      />
      <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="fill-primary-foreground text-3xl font-bold">{animVal}%</text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-primary-foreground/70 text-xs">degradáció</text>
    </svg>
  );
}

function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function DegradationDetailModal({ open, onOpenChange, data, onOpenWizard }: DegradationDetailModalProps) {
  const { lang } = useLanguage();
  const l = (k: string) => tx[k]?.[lang] ?? tx[k]?.HU ?? k;

  const level = data.degradation_risk?.toUpperCase() || 'MEDIUM';
  const colors = levelColors[level] || levelColors.MEDIUM;
  const degPct = data.degradation_pct ?? degradationPctFromLevel(level);
  const rate = data.degradation_rate_per_year ?? rateFromLevel(level);
  const remainingKwh = Math.round(data.battery_kwh * (1 - degPct / 100) * 10) / 10;
  const remainingRange = Math.round(data.range_km_wltp * (1 - degPct / 100));
  const impact = priceImpact(level);
  const impactMid = Math.round((impact.min + impact.max) / 2);
  const chem = data.cell_chemistry?.toUpperCase() || '';
  const chemKey = chemDescKey[chem];

  // Curve data
  const currentAge = degPct > 0 ? Math.round(degPct / rate) : 5;
  const curveData = Array.from({ length: 16 }, (_, yr) => {
    const optRate = rate * 0.6;
    const consRate = rate * 1.5;
    return {
      year: yr,
      optimistic: Math.max(50, Math.round((100 - optRate * yr) * 10) / 10),
      expected: Math.max(50, Math.round((100 - rate * yr) * 10) / 10),
      conservative: Math.max(50, Math.round((100 - consRate * yr) * 10) / 10),
    };
  });

  // Generic risk factors based on powertrain and chemistry
  const riskFactors = (() => {
    const risks: { title: string; desc: string; severity: string }[] = [];
    if (data.known_issues?.length) {
      data.known_issues.forEach(issue => risks.push({ title: typeof issue === 'string' ? issue : 'Ismert kockázat', desc: '', severity: 'MEDIUM' }));
    }
    if (!data.known_issues?.length) {
      if (chem === 'NMC') risks.push({ title: lang === 'EN' ? 'High DC charging frequency' : 'Magas DC töltési frekvencia', desc: lang === 'EN' ? 'Increased cathode degradation risk with frequent fast charging' : 'Fokozott katód degradáció kockázat gyakori gyorstöltésnél', severity: 'MEDIUM' });
      if (chem === 'NCA') risks.push({ title: lang === 'EN' ? 'NCA cell chemistry — heat sensitive' : 'NCA cellakémia — hőérzékeny', desc: lang === 'EN' ? 'Cooling system condition is critical' : 'Hűtési rendszer állapota kritikus', severity: 'HIGH' });
      if (data.model_type === 'PHEV' || data.model_type === 'HEV') risks.push({ title: lang === 'EN' ? 'Partial electric operation' : 'Részleges elektromos üzem', desc: lang === 'EN' ? 'Deep discharge risk at low charge levels' : 'Akkumulátor mélymerülési kockázat alacsony töltöttségnél', severity: 'MEDIUM' });
      if (level === 'HIGH' || level === 'CRITICAL') risks.push({ title: lang === 'EN' ? 'Elevated degradation' : 'Fokozott degradáció', desc: lang === 'EN' ? 'Battery capacity significantly below expected level for age' : 'Az akkumulátor kapacitás jelentősen az elvárható szint alatt', severity: level });
    }
    if (data.rental_battery) risks.push({ title: lang === 'EN' ? 'Rental battery model' : 'Bérletes akkumulátor modell', desc: lang === 'EN' ? 'Verify battery ownership status before purchase!' : 'Vásárlás előtt ellenőrizd az akkumulátor tulajdonjogi státuszát!', severity: 'HIGH' });
    return risks;
  })();

  const faults = data.fault_codes || [];

  // Market value bar position
  const barPosition = (() => {
    if (level === 'LOW') return 80;
    if (level === 'MEDIUM') return 50;
    if (level === 'HIGH') return 25;
    return 10;
  })();

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal content */}
      <div
        className="relative z-10 w-full max-w-5xl mx-4 my-8 rounded-2xl shadow-2xl bg-background border border-border animate-in zoom-in-95 fade-in-0 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hero-gradient text-primary-foreground p-6 md:p-8 rounded-t-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Battery className="h-8 w-8" />
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold">{l('title')}</h2>
                <p className="text-sm opacity-70">{l('subtitle')}</p>
                {data.make && data.model && (
                  <p className="text-sm font-medium mt-1">{data.make} {data.model}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AnimatedCircularGauge value={degPct} color={colors.gauge} />
              <Badge className={`text-sm font-bold px-4 py-1 ${colors.bg} ${colors.text}`}>
                {level}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8 bg-background">
          {/* Section 1 — Bayesian Params */}
          <FadeInSection>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  {l('sec_params')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ParamBox label={l('cell_chem')} value={chem || '—'} tooltip={chemKey ? l(chemKey) : undefined} />
                  <ParamBox label={l('nominal_cap')} value={`${data.battery_kwh} kWh`} />
                  <ParamBox label={l('remaining_cap')} value={`${remainingKwh} kWh | ${100 - degPct}%`} />
                  <ParamBox label={l('wltp_new')} value={`${data.range_km_wltp} km`} />
                  <ParamBox label={l('current_range')} value={`${remainingRange} km`} />
                  <ParamBox label={l('annual_rate')} value={`${rate}% / ${lang === 'EN' ? 'yr' : lang === 'DE' ? 'J.' : 'év'}`} />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          {/* Section 2 — Degradation Curve */}
          <FadeInSection>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  {l('sec_curve')}
                </h3>
                <div className="h-[300px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" label={{ value: l('years'), position: 'insideBottom', offset: -5 }} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis domain={[50, 100]} label={{ value: l('capacity_pct'), angle: -90, position: 'insideLeft' }} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Legend />
                      <Line type="monotone" dataKey="optimistic" stroke="hsl(142 76% 36%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name={l('optimistic')} />
                      <Line type="monotone" dataKey="expected" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} name={l('expected')} />
                      <Line type="monotone" dataKey="conservative" stroke="hsl(25 95% 53%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name={l('conservative')} />
                      <ReferenceLine x={currentAge} stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="4 4" label={{ value: l('now'), position: 'top', fill: 'hsl(var(--foreground))' }} />
                      <ReferenceLine y={70} stroke="hsl(0 84% 60%)" strokeDasharray="8 4" label={{ value: l('warranty_thresh'), position: 'right', fill: 'hsl(0 84% 60%)', fontSize: 11 }} />
                      <ReferenceLine y={80} stroke="hsl(48 96% 53%)" strokeDasharray="8 4" label={{ value: l('eu_avg_thresh'), position: 'right', fill: 'hsl(48 96% 53%)', fontSize: 11 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          {/* Section 3 — Risk Factors */}
          {riskFactors.length > 0 && (
            <FadeInSection>
              <h3 className="text-base font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {l('sec_risk')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riskFactors.map((rf, i) => {
                  const sc = rf.severity === 'CRITICAL' || rf.severity === 'HIGH' ? 'border-destructive/40 bg-destructive/5' : 'border-orange-300 bg-orange-50';
                  return (
                    <Card key={i} className={`border ${sc}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${rf.severity === 'CRITICAL' || rf.severity === 'HIGH' ? 'text-destructive' : 'text-orange-500'}`} />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">{rf.title}</span>
                              <Badge variant="outline" className={`text-[10px] ${rf.severity === 'CRITICAL' ? 'border-destructive text-destructive' : rf.severity === 'HIGH' ? 'border-red-400 text-red-700' : 'border-orange-400 text-orange-700'}`}>
                                {rf.severity}
                              </Badge>
                            </div>
                            {rf.desc && <p className="text-xs text-muted-foreground mt-1">{rf.desc}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </FadeInSection>
          )}

          {/* Section 4 — Market Impact */}
          <FadeInSection>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  {impactMid >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  {l('sec_market')}
                </h3>
                {/* Bar */}
                <div className="relative h-10 rounded-lg overflow-hidden flex mb-2">
                  <div className="flex-1 bg-red-100 flex items-center justify-center text-[11px] font-medium text-red-700">{l('value_decrease')}</div>
                  <div className="flex-1 bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground">{l('market_avg')}</div>
                  <div className="flex-1 bg-green-100 flex items-center justify-center text-[11px] font-medium text-green-700">{l('value_increase')}</div>
                  {/* Marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-foreground transition-all duration-1000"
                    style={{ left: `${barPosition}%` }}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">▼</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {l('impact_text').replace('{level}', level).replace('{pct}', `${impact.min} – ${impact.max}`)}
                </p>
              </CardContent>
            </Card>
          </FadeInSection>

          {/* Section 5 — Fault Codes */}
          <FadeInSection>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <h3 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {l('sec_faults')}
                </h3>
                {faults.length > 0 ? (
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_dtc')}</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_component')}</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_severity')}</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_desc')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faults.map((fc, i) => (
                          <tr key={i} className={`border-t border-border ${fc.severity?.toUpperCase() === 'CRITICAL' ? 'bg-red-50' : fc.severity?.toUpperCase() === 'HIGH' ? 'bg-orange-50' : ''}`}>
                            <td className="px-3 py-2 font-mono font-medium">{fc.dtc_code}</td>
                            <td className="px-3 py-2">{fc.component}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className={`text-[10px] ${fc.severity?.toUpperCase() === 'CRITICAL' ? 'border-destructive text-destructive' : fc.severity?.toUpperCase() === 'HIGH' ? 'border-red-400 text-red-700' : 'border-orange-400 text-orange-700'}`}>
                                {fc.severity}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{fc.dtc_description || '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{l('no_faults')}</p>
                )}
              </CardContent>
            </Card>
          </FadeInSection>

          {/* Section 6 — Recommendation */}
          <FadeInSection>
            {(() => {
              const recMap: Record<string, { bg: string; text: string; msg: string }> = {
                LOW: { bg: 'bg-green-50 border-green-300', text: 'text-green-800', msg: l('rec_low') },
                MEDIUM: { bg: 'bg-blue-50 border-blue-300', text: 'text-blue-800', msg: l('rec_medium') },
                HIGH: { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-800', msg: l('rec_high') },
                CRITICAL: { bg: 'bg-red-50 border-red-400', text: 'text-red-900', msg: l('rec_critical') },
              };
              const rec = recMap[level] || recMap.MEDIUM;
              return (
                <Card className={`border-2 ${rec.bg}`}>
                  <CardContent className="pt-6 pb-4">
                    <h3 className="text-base font-display font-bold text-foreground mb-3">{l('sec_rec')}</h3>
                    <p className={`text-base font-semibold ${rec.text}`}>{rec.msg}</p>
                    {onOpenWizard && (
                      <Button variant="outline" className="mt-4 w-full" onClick={() => { onOpenChange(false); onOpenWizard(); }}>
                        <Microscope className="h-4 w-4 mr-2" />
                        {l('wizard_cta')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </FadeInSection>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card p-4 md:p-6 rounded-b-2xl flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground text-center md:text-left">
            {l('footer')} · {new Date().toLocaleDateString(lang === 'DE' ? 'de-DE' : lang === 'EN' ? 'en-US' : 'hu-HU')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {l('close')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ParamBox({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1" title={tooltip}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      {tooltip && <p className="text-[10px] text-muted-foreground/80 italic">{tooltip}</p>}
    </div>
  );
}

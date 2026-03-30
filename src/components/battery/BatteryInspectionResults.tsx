import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Download, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Check, Minus } from 'lucide-react';
import type { Lang } from '@/i18n/translations';
import { useLanguage } from '@/i18n/LanguageContext';
import { batteryWizardTx } from '@/i18n/batteryWizard.i18n';

export interface InspectionResult {
  battery_health_score: number;
  battery_health_label: string;
  estimated_remaining_capacity_pct: number;
  estimated_remaining_capacity_kwh: number;
  degradation_rate_per_year_pct: number;
  powertrain_risk_score: number;
  ice_health_score: number | null;
  risk_factors: { factor: string; severity: string; description: string; impact_score: number }[];
  positive_factors: { factor: string; description: string }[];
  inspection_checklist: { item: string; priority: string; reason: string }[];
  buy_recommendation: string;
  buy_recommendation_reasoning: string;
  expected_battery_life_years: number;
  estimated_replacement_cost_eur: { min: number; max: number };
  price_impact_pct: number;
  summary_hu: string;
  bayesian_confidence: number;
  // New fields
  soh_estimated_pct?: number;
  soh_confidence?: number;
  soh_uncertainty_pct?: number;
  data_source_type?: string;
  data_completeness_pct?: number;
  bayesian_drivers?: { factor: string; contribution_pct: number }[];
  battery_risk_class?: string;
  risk_class_description?: string;
  cycle_proxy?: { estimated_cycles: number | null; ac_dc_ratio_pct: number | null; fast_charge_stress: string };
  thermal_exposure?: { heat_stress_index: string; degradation_accelerator: number };
  cell_imbalance_risk?: string;
  usage_profile?: { pattern: string; daily_km_estimated: number | null; low_dc_usage: boolean };
  price_impact_detailed?: { conservative_pct: number; expected_pct: number; optimistic_pct: number; liquidity_time_to_sell_impact_pct: number };
  dtc_risk_contributions?: { dtc_code: string; degradation_risk_contribution_pct: number; confidence_impact: number }[];
  dealer_recommendation?: { label: string; target_discount_pct_min: number; target_discount_pct_max: number; risk_buffer_eur_min: number; risk_buffer_eur_max: number };
  soc_context?: { measurement_context: string | null; cell_imbalance_validated: boolean };
}

const tx: Record<string, Record<Lang, string>> = {
  battery_health: { HU: 'Akkumulátor egészség', EN: 'Battery Health', DE: 'Batteriezustand' },
  recommendation: { HU: 'Vásárlási ajánlás', EN: 'Buy Recommendation', DE: 'Kaufempfehlung' },
  confidence: { HU: 'Bayes konfidencia', EN: 'Bayesian confidence', DE: 'Bayes-Konfidenz' },
  remaining_cap: { HU: 'Becsült maradék kapacitás', EN: 'Estimated remaining capacity', DE: 'Geschätzte Restkapazität' },
  degradation_rate: { HU: 'Éves degradációs ráta', EN: 'Annual degradation rate', DE: 'Jährl. Degradationsrate' },
  expected_life: { HU: 'Várható élettartam', EN: 'Expected battery life', DE: 'Erwartete Lebensdauer' },
  replacement_cost: { HU: 'Becsült csereköltség', EN: 'Est. replacement cost', DE: 'Gesch. Austauschkosten' },
  price_impact: { HU: 'Árkihatás', EN: 'Price impact', DE: 'Preisauswirkung' },
  ice_health: { HU: 'ICE motor egészség', EN: 'ICE engine health', DE: 'Verbrennungsmotor' },
  risk_factors: { HU: 'Kockázati tényezők', EN: 'Risk factors', DE: 'Risikofaktoren' },
  positive_factors: { HU: 'Pozitív tényezők', EN: 'Positive factors', DE: 'Positive Faktoren' },
  checklist: { HU: 'Ellenőrzési checklist', EN: 'Inspection checklist', DE: 'Prüfcheckliste' },
  summary: { HU: 'AI Összefoglaló', EN: 'AI Summary', DE: 'KI-Zusammenfassung' },
  pdf_export: { HU: 'Előellenőrzési riport letöltése', EN: 'Download pre-inspection report', DE: 'Vorinspektionsbericht herunterladen' },
  years: { HU: 'év', EN: 'years', DE: 'Jahre' },
};

function AnimatedGauge({ value, max = 100, color, size = 140 }: { value: number; max?: number; size?: number; color: string }) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimVal(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animVal / max) * circumference;

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circumference} strokeDashoffset={circumference - progress}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em" className="fill-foreground text-2xl font-bold">
        {animVal}
      </text>
    </svg>
  );
}

function SemiCircleGauge({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  const r = (size - 12) / 2;
  const c = Math.PI * r;
  const progress = (animVal / 100) * c;
  return (
    <svg width={size} height={size / 2 + 12} className="mx-auto">
      <path d={`M 6,${size / 2} A ${r},${r} 0 0,1 ${size - 6},${size / 2}`} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} opacity={0.3} />
      <path d={`M 6,${size / 2} A ${r},${r} 0 0,1 ${size - 6},${size / 2}`} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={c} strokeDashoffset={c - progress} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-foreground text-lg font-bold">{animVal}%</text>
    </svg>
  );
}

function gaugeColor(score: number) {
  if (score >= 80) return 'hsl(142 76% 36%)';
  if (score >= 60) return 'hsl(48 96% 53%)';
  if (score >= 40) return 'hsl(25 95% 53%)';
  return 'hsl(0 84% 60%)';
}

function confidenceColor(v: number) {
  if (v >= 0.8) return 'hsl(142 76% 36%)';
  if (v >= 0.6) return 'hsl(48 96% 53%)';
  return 'hsl(25 95% 53%)';
}

const recBadgeColor: Record<string, string> = {
  'ERŐSEN AJÁNLOTT': 'bg-green-600 text-white',
  'AJÁNLOTT': 'bg-green-500 text-white',
  'FELTÉTELESEN AJÁNLOTT': 'bg-yellow-500 text-black',
  'NEM AJÁNLOTT': 'bg-orange-600 text-white',
  'HATÁROZOTTAN ELLENJAVALLOTT': 'bg-red-600 text-white',
  'HIGHLY RECOMMENDED': 'bg-green-600 text-white',
  'RECOMMENDED': 'bg-green-500 text-white',
  'CONDITIONALLY RECOMMENDED': 'bg-yellow-500 text-black',
  'NOT RECOMMENDED': 'bg-orange-600 text-white',
  'STRONGLY ADVISED AGAINST': 'bg-red-600 text-white',
};

const severityColor: Record<string, string> = {
  LOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MEDIUM: 'bg-orange-100 text-orange-800 border-orange-300',
  HIGH: 'bg-red-100 text-red-800 border-red-300',
  CRITICAL: 'bg-red-200 text-red-900 border-red-500',
};

const priorityStyle: Record<string, string> = {
  'KÖTELEZŐ': 'bg-red-50 border-red-200',
  'JAVASOLT': 'bg-orange-50 border-orange-200',
  'OPCIONÁLIS': 'bg-muted/50 border-border',
  'MANDATORY': 'bg-red-50 border-red-200',
  'RECOMMENDED': 'bg-orange-50 border-orange-200',
  'OPTIONAL': 'bg-muted/50 border-border',
};

const priorityBadge: Record<string, string> = {
  'KÖTELEZŐ': 'bg-red-600 text-white',
  'JAVASOLT': 'bg-orange-500 text-white',
  'OPCIONÁLIS': 'bg-muted text-muted-foreground',
  'MANDATORY': 'bg-red-600 text-white',
  'RECOMMENDED': 'bg-orange-500 text-white',
  'OPTIONAL': 'bg-muted text-muted-foreground',
};

const RISK_CLASSES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const riskClassColor = (cls: string) => {
  if (cls.startsWith('A')) return 'bg-green-500';
  if (cls.startsWith('B')) return 'bg-yellow-500';
  return 'bg-red-500';
};

const dealerBadgeColor: Record<string, string> = {
  'STRONG BUY': 'bg-green-600 text-white',
  'BUY': 'bg-green-500 text-white',
  'CONDITIONAL BUY': 'bg-yellow-500 text-black',
  'AVOID': 'bg-orange-600 text-white',
  'REJECT': 'bg-red-600 text-white',
};

export default function BatteryInspectionResults({ result, showIce, modelInfo }: { result: InspectionResult; showIce: boolean; modelInfo?: { make: string; model: string; variant?: string; model_type: string } }) {
  const { lang } = useLanguage();
  const l = (k: string) => tx[k]?.[lang] ?? tx[k]?.HU ?? k;
  const bt = (k: string) => batteryWizardTx[k]?.[lang] ?? batteryWizardTx[k]?.HU ?? k;
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero gauge + recommendation */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center">
              <AnimatedGauge value={result.battery_health_score} color={gaugeColor(result.battery_health_score)} />
              <p className="text-sm font-semibold text-foreground mt-2">{l('battery_health')}</p>
              <Badge className="mt-1 text-xs">{result.battery_health_label}</Badge>
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div>
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${recBadgeColor[result.buy_recommendation] || 'bg-muted text-foreground'}`}>
                  {result.buy_recommendation}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{result.buy_recommendation_reasoning}</p>
              <p className="text-xs text-muted-foreground">
                {l('confidence')}: {Math.round(result.bayesian_confidence * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section A — SOH + Confidence */}
      {result.soh_estimated_pct != null && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-1">
                <p className="text-3xl font-bold text-foreground">{result.soh_estimated_pct}%</p>
                <p className="text-xs text-muted-foreground">{bt('soh_label')}</p>
                <Badge variant="outline" className="text-[10px]">{result.data_source_type ?? 'Model-based'}</Badge>
              </div>
              <div className="text-center space-y-1">
                <SemiCircleGauge value={Math.round((result.soh_confidence ?? 0) * 100)} color={confidenceColor(result.soh_confidence ?? 0)} />
                <p className="text-xs text-muted-foreground">{bt('confidence_label')}</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-3xl font-bold text-foreground">±{result.soh_uncertainty_pct ?? 0}%</p>
                <p className="text-xs text-muted-foreground">{bt('uncertainty_label')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{bt('data_source_label')}</p>
                {(['Model-based', 'BMS-read', 'OBD-validated'] as const).map(src => (
                  <div key={src} className="flex items-center gap-2 text-xs">
                    {result.data_source_type === src ? <Check className="h-3 w-3 text-green-600" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
                    <span className={result.data_source_type === src ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                      {src === 'Model-based' ? bt('model_based_label') : src === 'BMS-read' ? bt('bms_read_label') : bt('obd_validated_label')}
                    </span>
                  </div>
                ))}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{bt('data_completeness_label')}</span>
                    <span>{result.data_completeness_pct ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${result.data_completeness_pct ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
            {result.data_source_type === 'Model-based' && (
              <p className="text-[10px] text-muted-foreground mt-3 italic">{bt('no_bms_notice')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricBox label={l('remaining_cap')} value={`${result.estimated_remaining_capacity_kwh} kWh (${result.estimated_remaining_capacity_pct}%)`} />
        <MetricBox label={l('degradation_rate')} value={`${result.degradation_rate_per_year_pct}% / ${lang === 'EN' ? 'yr' : lang === 'DE' ? 'J.' : 'év'}`} />
        <MetricBox label={l('expected_life')} value={`${result.expected_battery_life_years} ${l('years')}`} />
        <MetricBox label={l('replacement_cost')} value={`€${result.estimated_replacement_cost_eur.min.toLocaleString()} – €${result.estimated_replacement_cost_eur.max.toLocaleString()}`} />
        <MetricBox label={l('price_impact')} value={`${result.price_impact_pct > 0 ? '+' : ''}${result.price_impact_pct}%`} highlight={result.price_impact_pct < 0 ? 'negative' : 'positive'} />
        {showIce && result.ice_health_score != null && (
          <div className="flex flex-col items-center justify-center">
            <AnimatedGauge value={result.ice_health_score} color={gaugeColor(result.ice_health_score)} size={100} />
            <p className="text-xs text-muted-foreground mt-1">{l('ice_health')}</p>
          </div>
        )}
      </div>

      {/* Section B — Bayesian Drivers */}
      {result.bayesian_drivers && result.bayesian_drivers.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <h3 className="text-sm font-bold text-foreground mb-4">{bt('bayesian_drivers_title')}</h3>
            <div className="space-y-3">
              {result.bayesian_drivers.map((d, i) => (
                <BayesianBar key={i} factor={d.factor} pct={d.contribution_pct} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              {bt('bayesian_drivers_total')}: +{result.bayesian_drivers.reduce((s, d) => s + d.contribution_pct, 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Section C — Battery Risk Class */}
      {result.battery_risk_class && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <h3 className="text-sm font-bold text-foreground mb-4">{bt('risk_class_title')}</h3>
            <div className="flex items-center justify-center gap-1 mb-3">
              {RISK_CLASSES.map(cls => (
                <div key={cls} className={`px-3 py-2 rounded-lg text-xs font-bold text-white transition-all ${riskClassColor(cls)} ${cls === result.battery_risk_class ? 'ring-2 ring-foreground scale-110 animate-pulse' : 'opacity-40'}`}>
                  {cls}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">{result.risk_class_description}</p>
            <p className="text-center text-xs text-muted-foreground mt-1">Battery Risk Class: {result.battery_risk_class}</p>
          </CardContent>
        </Card>
      )}

      {/* Risk factors */}
      {result.risk_factors.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {l('risk_factors')}
          </h3>
          <div className="space-y-2">
            {result.risk_factors.map((rf, i) => (
              <RiskCard key={i} rf={rf} />
            ))}
          </div>
        </div>
      )}

      {/* Positive factors */}
      {result.positive_factors.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {l('positive_factors')}
          </h3>
          <div className="space-y-2">
            {result.positive_factors.map((pf, i) => (
              <Card key={i} className="border-green-200 bg-green-50/50">
                <CardContent className="p-3">
                  <p className="text-sm font-semibold text-foreground">{pf.factor}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pf.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      {result.inspection_checklist.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {l('checklist')}
          </h3>
          <div className="space-y-2">
            {result.inspection_checklist.map((ci, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${priorityStyle[ci.priority] || 'bg-muted/50 border-border'}`}
              >
                <Checkbox
                  checked={!!checkedItems[i]}
                  onCheckedChange={() => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{ci.item}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge[ci.priority] || 'bg-muted text-muted-foreground'}`}>
                      {ci.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ci.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section D — Detailed Price Impact */}
      {result.price_impact_detailed && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <h3 className="text-sm font-bold text-foreground mb-4">{l('price_impact')}</h3>
            <div className="space-y-3">
              <PriceBar label={bt('price_impact_pessimistic')} pct={result.price_impact_detailed.conservative_pct} color="bg-red-500" />
              <PriceBar label={bt('price_impact_expected')} pct={result.price_impact_detailed.expected_pct} color="bg-primary" />
              <PriceBar label={bt('price_impact_optimistic')} pct={result.price_impact_detailed.optimistic_pct} color="bg-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {bt('liquidity_impact')}: +{result.price_impact_detailed.liquidity_time_to_sell_impact_pct}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Section E — DTC contributions */}
      {result.dtc_risk_contributions && result.dtc_risk_contributions.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <h3 className="text-sm font-bold text-foreground mb-3">{bt('dtc_contribution_title')}</h3>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{bt('dtc_col_code')}</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{bt('dtc_col_degradation')}</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{bt('dtc_col_confidence')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dtc_risk_contributions.map((dtc, i) => (
                    <tr key={i} className={`border-t border-border ${dtc.degradation_risk_contribution_pct > 5 ? 'bg-red-50' : 'bg-orange-50'}`}>
                      <td className="px-3 py-2 font-mono font-medium">{dtc.dtc_code}</td>
                      <td className="px-3 py-2 font-semibold text-destructive">+{dtc.degradation_risk_contribution_pct}%</td>
                      <td className="px-3 py-2 text-muted-foreground">{dtc.confidence_impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section F — Dealer Recommendation */}
      {result.dealer_recommendation && (
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="text-sm font-bold text-foreground mb-3">{bt('dealer_rec_title')}</h3>
            <div className="text-center mb-4">
              <span className={`inline-block px-5 py-2 rounded-lg text-base font-bold ${dealerBadgeColor[result.dealer_recommendation.label] || 'bg-muted text-foreground'}`}>
                {result.dealer_recommendation.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{bt('dealer_discount_label')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.dealer_recommendation.target_discount_pct_min}% – {result.dealer_recommendation.target_discount_pct_max}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{bt('dealer_buffer_label')}</p>
                <p className="text-2xl font-bold text-foreground">
                  €{result.dealer_recommendation.risk_buffer_eur_min.toLocaleString()} – €{result.dealer_recommendation.risk_buffer_eur_max.toLocaleString()}
                </p>
              </div>
            </div>
            {result.battery_risk_class && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Battery Risk Class: {result.battery_risk_class} · {result.risk_class_description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{l('summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{result.summary_hu}</p>
        </CardContent>
      </Card>

      {/* PDF button */}
      <Button variant="outline" className="w-full" onClick={async () => {
        const { generateInspectionPdf } = await import('./generateInspectionPdf');
        generateInspectionPdf({
          result,
          modelInfo: modelInfo || { make: 'N/A', model: 'N/A', model_type: 'BEV' },
          lang,
        });
      }}>
        <Download className="h-4 w-4 mr-2" />
        {l('pdf_export')}
      </Button>
    </div>
  );
}

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: 'positive' | 'negative' }) {
  return (
    <Card className="border-border">
      <CardContent className="p-3 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-base font-bold mt-1 ${highlight === 'negative' ? 'text-destructive' : highlight === 'positive' ? 'text-green-600' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RiskCard({ rf }: { rf: { factor: string; severity: string; description: string; impact_score: number } }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Card className={`border cursor-pointer hover:shadow-sm transition-shadow ${rf.severity === 'CRITICAL' ? 'border-red-400' : rf.severity === 'HIGH' ? 'border-red-300' : 'border-orange-200'}`}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className={`h-4 w-4 ${rf.severity === 'CRITICAL' || rf.severity === 'HIGH' ? 'text-destructive' : 'text-orange-500'}`} />
              <span className="text-sm font-medium text-foreground">{rf.factor}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor[rf.severity] || ''}`}>
                {rf.severity}
              </span>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 rounded-b-lg border border-t-0 border-border">
          {rf.description}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function BayesianBar({ factor, pct }: { factor: string; pct: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);
  const color = pct > 6 ? 'bg-red-500' : pct >= 3 ? 'bg-orange-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 truncate">{factor}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(w * 5, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-10 text-right">+{pct}%</span>
    </div>
  );
}

function PriceBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.abs(pct)), 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(w * 3, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${pct < 0 ? 'text-destructive' : 'text-green-600'}`}>{pct > 0 ? '+' : ''}{pct}%</span>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Download, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Lang } from '@/i18n/translations';
import { useLanguage } from '@/i18n/LanguageContext';

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

function gaugeColor(score: number) {
  if (score >= 80) return 'hsl(142 76% 36%)';
  if (score >= 60) return 'hsl(48 96% 53%)';
  if (score >= 40) return 'hsl(25 95% 53%)';
  return 'hsl(0 84% 60%)';
}

const recBadgeColor: Record<string, string> = {
  'ERŐSEN AJÁNLOTT': 'bg-green-600 text-white',
  'AJÁNLOTT': 'bg-green-500 text-white',
  'FELTÉTELESEN AJÁNLOTT': 'bg-yellow-500 text-black',
  'NEM AJÁNLOTT': 'bg-orange-600 text-white',
  'HATÁROZOTTAN ELLENJAVALLOTT': 'bg-red-600 text-white',
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
};

const priorityBadge: Record<string, string> = {
  'KÖTELEZŐ': 'bg-red-600 text-white',
  'JAVASOLT': 'bg-orange-500 text-white',
  'OPCIONÁLIS': 'bg-muted text-muted-foreground',
};

export default function BatteryInspectionResults({ result, showIce, modelInfo }: { result: InspectionResult; showIce: boolean; modelInfo?: { make: string; model: string; variant?: string; model_type: string } }) {
  const { lang } = useLanguage();
  const l = (k: string) => tx[k]?.[lang] ?? tx[k]?.HU ?? k;
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

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricBox label={l('remaining_cap')} value={`${result.estimated_remaining_capacity_kwh} kWh (${result.estimated_remaining_capacity_pct}%)`} />
        <MetricBox label={l('degradation_rate')} value={`${result.degradation_rate_per_year_pct}% / év`} />
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
      <Button variant="outline" className="w-full" onClick={() => {
        const { generateInspectionPdf } = require('./generateInspectionPdf');
        generateInspectionPdf({
          result,
          modelInfo: modelInfo || { make: 'N/A', model: 'N/A', model_type: 'BEV' },
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

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';

const tx: Record<string, Record<Lang, string>> = {
  data_quality: { HU: 'Adatminőség', EN: 'Data quality', DE: 'Datenqualität' },
  details: { HU: 'Részletek', EN: 'Details', DE: 'Details' },
};

export interface EVModelCardProps {
  make: string;
  model: string;
  variant: string;
  battery_kwh: number;
  range_km_wltp: number;
  fast_charge_kw: number;
  cell_chemistry: string;
  data_confidence: number;
  model_type?: string;
  onClick: () => void;
}

const modelTypeBadge: Record<string, string> = {
  BEV: 'bg-blue-100 text-blue-800 border-blue-300',
  PHEV: 'bg-green-100 text-green-800 border-green-300',
  HEV: 'bg-orange-100 text-orange-800 border-orange-300',
  MHEV: 'bg-muted text-muted-foreground border-border',
};

const chemistryStyle: Record<string, string> = {
  LFP: 'bg-green-100 text-green-800 border-green-300',
  NMC: 'bg-blue-100 text-blue-800 border-blue-300',
  NCA: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function EVModelCard({
  make, model, variant, battery_kwh, range_km_wltp,
  fast_charge_kw, cell_chemistry, data_confidence, model_type, onClick,
}: EVModelCardProps) {
  const confPct = Math.round((data_confidence ?? 0) * 100);
  const chemClass = chemistryStyle[cell_chemistry?.toUpperCase()] || 'bg-muted text-muted-foreground';

  return (
    <Card className="border border-border bg-card hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="pt-5 pb-4 space-y-3">
        {/* Header */}
        <div>
          <h3 className="font-display font-bold text-foreground text-base leading-tight">
            {make} {model}
          </h3>
          {variant && (
            <p className="text-xs text-muted-foreground mt-0.5">{variant}</p>
          )}
        </div>

        {/* Specs row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
          <span>🔋 {battery_kwh} kWh</span>
          <span>📍 {range_km_wltp} km</span>
          <span>⚡ {fast_charge_kw} kW DC</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {model_type && (
            <Badge className={`text-[10px] border ${modelTypeBadge[model_type] || 'bg-muted text-muted-foreground border-border'}`}>
              {model_type}
            </Badge>
          )}
          {cell_chemistry && (
            <Badge className={`text-[10px] border ${chemClass}`}>
              {cell_chemistry}
            </Badge>
          )}
        </div>

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Adatminőség</span>
            <span className="font-semibold">{confPct}%</span>
          </div>
          <Progress value={confPct} className="h-1.5" />
        </div>

        {/* Details button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-primary group-hover:bg-primary/5"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          Részletek
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

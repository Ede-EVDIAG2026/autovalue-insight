import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';

const fmt = (v: number) => v ? new Intl.NumberFormat('hu-HU').format(Math.round(v)) : '—';

const ValueBandChart = ({
  p10, p25, p50, p75, p90,
  recommendedAsk, negotiationFloor,
  recommendedAskEur, negotiationFloorEur,
  confidence,
}: {
  p10: number; p25: number; p50: number; p75: number; p90: number;
  recommendedAsk: number; negotiationFloor: number;
  recommendedAskEur: number; negotiationFloorEur: number;
  confidence: number;
}) => {
  const { tr } = useLanguage();

  const range = p90 - p10 || 1;
  const getPos = (v: number) => ((v - p10) / range) * 100;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-foreground text-lg">{tr('value_band')}</h3>
        <Badge variant="outline" className="text-primary border-primary/30">
          {tr('confidence')}: {Math.round(confidence * 100)}%
        </Badge>
      </div>

      {/* Recommended ask - hero number */}
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground mb-1">{tr('recommended_ask')}</p>
        <p className="text-4xl font-display font-bold text-primary">{fmt(recommendedAsk)} Ft</p>
        <p className="text-sm text-muted-foreground mt-1">€ {fmt(recommendedAskEur)}</p>
      </div>

      {/* Visual band */}
      <div className="relative h-12 mb-8">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 rounded-full overflow-hidden bg-muted">
          {/* Gradient band from P10 to P90 */}
          <div className="absolute inset-0 value-band-gradient opacity-30" />
          {/* Green sweet spot P25–P75 */}
          <div 
            className="absolute top-0 bottom-0 bg-secondary/40 rounded"
            style={{ left: `${getPos(p25)}%`, width: `${getPos(p75) - getPos(p25)}%` }}
          />
        </div>
        
        {/* Recommended ask marker */}
        <div 
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${getPos(recommendedAsk)}%` }}
        >
          <div className="w-0.5 h-full bg-primary" />
          <div className="absolute -top-1 w-3 h-3 rounded-full bg-primary shadow-lg" />
        </div>

        {/* Negotiation floor marker */}
        <div 
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${getPos(negotiationFloor)}%` }}
        >
          <div className="w-0.5 h-full bg-destructive/60" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="text-center">
          <p>P10</p>
          <p className="font-medium text-foreground">{fmt(p10)} Ft</p>
        </div>
        <div className="text-center">
          <p>P25</p>
          <p className="font-medium text-foreground">{fmt(p25)} Ft</p>
        </div>
        <div className="text-center">
          <p className="text-primary font-bold">P50</p>
          <p className="font-medium text-primary">{fmt(p50)} Ft</p>
        </div>
        <div className="text-center">
          <p>P75</p>
          <p className="font-medium text-foreground">{fmt(p75)} Ft</p>
        </div>
        <div className="text-center">
          <p>P90</p>
          <p className="font-medium text-foreground">{fmt(p90)} Ft</p>
        </div>
      </div>

      {/* Negotiation floor line */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <div className="w-4 h-0.5 bg-destructive/60" />
        <span className="text-muted-foreground">{tr('negotiation_floor')}:</span>
        <span className="font-medium text-foreground">{fmt(negotiationFloor)} Ft</span>
        <span className="text-muted-foreground text-xs">(€ {fmt(negotiationFloorEur)})</span>
      </div>
    </div>
  );
};

export default ValueBandChart;

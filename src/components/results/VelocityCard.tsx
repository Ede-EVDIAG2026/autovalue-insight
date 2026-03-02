import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

const VelocityCard = ({
  velocityAtRecommended,
  velocityAtAggressive,
  stalenessRisk,
  priceTrend,
  priceTrendPct,
  marketDepth,
}: {
  velocityAtRecommended: number;
  velocityAtAggressive: number;
  stalenessRisk: string;
  priceTrend: string;
  priceTrendPct: number;
  marketDepth: string;
}) => {
  const { tr } = useLanguage();

  const trendIcon = priceTrend === 'rising' ? <TrendingUp className="h-4 w-4" /> :
    priceTrend === 'falling' ? <TrendingDown className="h-4 w-4" /> :
    <Minus className="h-4 w-4" />;

  const trendColor = priceTrend === 'rising' ? 'text-secondary' :
    priceTrend === 'falling' ? 'text-destructive' : 'text-muted-foreground';

  const depthLabels: Record<string, string> = {
    thin: 'Vékony', normal: 'Normál', liquid: 'Likvid'
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-bold text-foreground text-lg mb-4">
        {tr('market_position')}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">{tr('days_at_recommended')}</p>
          <p className="text-2xl font-bold text-foreground">{velocityAtRecommended || '—'}</p>
          <p className="text-xs text-muted-foreground">nap</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <Clock className="h-5 w-5 text-secondary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">{tr('days_at_aggressive')}</p>
          <p className="text-2xl font-bold text-foreground">{velocityAtAggressive || '—'}</p>
          <p className="text-xs text-muted-foreground">nap</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <div className={`flex items-center justify-center gap-1 mb-2 ${trendColor}`}>
            {trendIcon}
          </div>
          <p className="text-xs text-muted-foreground mb-1">{tr('price_trend')}</p>
          <p className={`text-lg font-bold ${trendColor}`}>
            {priceTrendPct > 0 ? '+' : ''}{priceTrendPct}%
          </p>
          <p className="text-xs text-muted-foreground">3 hónap</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground mb-2">{tr('market_depth')}</p>
          <Badge variant="outline">{depthLabels[marketDepth] || marketDepth}</Badge>
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={
                stalenessRisk === 'low' ? 'border-secondary/30 text-secondary' :
                stalenessRisk === 'high' ? 'border-destructive/30 text-destructive' :
                'border-yellow-500/30 text-yellow-600'
              }
            >
              Kockázat: {stalenessRisk}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VelocityCard;

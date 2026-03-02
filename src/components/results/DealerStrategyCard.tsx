import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';

const fmt = (v: number) => v ? new Intl.NumberFormat('hu-HU').format(Math.round(v)) : '—';

const DealerStrategyCard = ({
  summary,
  recommendedPrice,
  recommendedPriceEur,
  bandLabel,
  quickActions,
}: {
  summary: string;
  recommendedPrice: number;
  recommendedPriceEur: number;
  bandLabel: string;
  quickActions: Array<{ priority: string; action_hu: string; expected_impact_hu: string }>;
}) => {
  const { tr } = useLanguage();

  const priorityStyles: Record<string, string> = {
    azonnali: 'bg-destructive/10 text-destructive border-destructive/20',
    '1_heten_belul': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    opcionalis: 'bg-muted text-muted-foreground border-border',
  };

  const priorityLabels: Record<string, string> = {
    azonnali: tr('immediate'),
    '1_heten_belul': tr('within_week'),
    opcionalis: tr('optional'),
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-bold text-foreground text-lg mb-4">
        {tr('dealer_summary')}
      </h3>

      {summary && (
        <p className="text-foreground leading-relaxed mb-6 p-4 rounded-lg bg-primary-light/50 border border-primary/10">
          {summary}
        </p>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">{tr('recommended_ask')}</p>
          <p className="text-3xl font-display font-bold text-primary">{fmt(recommendedPrice)} Ft</p>
          <p className="text-sm text-muted-foreground">€ {fmt(recommendedPriceEur)}</p>
        </div>
        {bandLabel && (
          <Badge className="bg-primary/10 text-primary border-primary/20 self-start">
            {bandLabel}
          </Badge>
        )}
      </div>

      {quickActions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">{tr('quick_actions')}:</p>
          <div className="space-y-2">
            {quickActions.map((a, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border ${priorityStyles[a.priority] || priorityStyles.opcionalis}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {priorityLabels[a.priority] || a.priority}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{a.action_hu}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.expected_impact_hu}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerStrategyCard;

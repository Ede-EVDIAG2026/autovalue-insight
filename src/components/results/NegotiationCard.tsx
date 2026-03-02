import { useLanguage } from '@/i18n/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

const fmt = (v: number) => v ? new Intl.NumberFormat('hu-HU').format(Math.round(v)) : '—';

const NegotiationCard = ({
  buyerStrategy,
  dealerStrategy,
}: {
  buyerStrategy: any;
  dealerStrategy: any;
}) => {
  const { tr } = useLanguage();

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-bold text-foreground text-lg mb-4">
        {tr('negotiation_strategy')}
      </h3>

      <Tabs defaultValue="buyer">
        <TabsList className="w-full">
          <TabsTrigger value="buyer" className="flex-1">{tr('buyer_tab')}</TabsTrigger>
          <TabsTrigger value="seller" className="flex-1">{tr('seller_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="buyer" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary-light text-center">
              <p className="text-xs text-muted-foreground mb-1">{tr('opening_offer')}</p>
              <p className="text-lg font-bold text-secondary">{fmt(buyerStrategy.opening_offer_huf)} Ft</p>
            </div>
            <div className="p-4 rounded-lg bg-primary-light text-center">
              <p className="text-xs text-muted-foreground mb-1">{tr('target_price')}</p>
              <p className="text-lg font-bold text-primary">{fmt(buyerStrategy.target_price_huf)} Ft</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">{tr('walk_away')}</p>
              <p className="text-lg font-bold text-destructive">{fmt(buyerStrategy.walk_away_above_huf)} Ft</p>
            </div>
          </div>

          {buyerStrategy.negotiation_arguments?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{tr('arguments')}:</p>
              <ul className="space-y-1.5">
                {buyerStrategy.negotiation_arguments.map((arg: any, i: number) => (
                  <li key={i} className="text-sm flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-foreground">{arg.argument_hu}</span>
                    <span className="font-medium text-destructive shrink-0 ml-2">
                      −{fmt(Math.abs(arg.value_impact_huf))} Ft
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {buyerStrategy.red_flags_hu?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {tr('red_flags')}:
              </p>
              <ul className="space-y-1">
                {buyerStrategy.red_flags_hu.map((flag: string, i: number) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-destructive">•</span> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="seller" className="mt-4 space-y-4">
          <div className="p-4 rounded-lg bg-primary-light text-center">
            <p className="text-xs text-muted-foreground mb-1">{tr('optimal_ask')}</p>
            <p className="text-2xl font-bold text-primary">{fmt(dealerStrategy.optimal_ask_huf)} Ft</p>
          </div>

          {dealerStrategy.repairs_recommended?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{tr('worth_doing')}:</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Javítás</TableHead>
                    <TableHead className="text-foreground">Költség</TableHead>
                    <TableHead className="text-foreground">Értéknöv.</TableHead>
                    <TableHead className="text-foreground">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dealerStrategy.repairs_recommended.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-foreground">{r.repair_hu}</TableCell>
                      <TableCell className="text-foreground">{fmt(r.cost_eur * 395)} Ft</TableCell>
                      <TableCell className="text-secondary">{fmt(r.value_gain_eur * 395)} Ft</TableCell>
                      <TableCell className="font-medium text-foreground">{r.roi}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {dealerStrategy.repairs_to_skip?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{tr('skip_repairs')}:</p>
              <ul className="space-y-1">
                {dealerStrategy.repairs_to_skip.map((r: any, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span>✕</span> <strong>{r.repair_hu}</strong> — {r.reason_hu}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NegotiationCard;

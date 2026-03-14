import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, BarChart3, TrendingUp, Activity, Layers, Info } from 'lucide-react';
import type { MarketSignal } from '@/types/marketIntelligence';

function fmt(n: number | null | undefined, type: 'eur' | 'km' | 'pct' | 'num' = 'num'): string {
  if (n == null) return '–';
  if (type === 'eur') return `€${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;
  if (type === 'km') return `${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })} km`;
  if (type === 'pct') return `${n.toFixed(1)}%`;
  return n.toLocaleString('de-DE');
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4 flex items-start gap-3">
        {icon && <div className="mt-0.5 text-primary/70">{icon}</div>}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold text-foreground leading-tight mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalCard({ signal, icon }: { signal: MarketSignal | null; icon: React.ReactNode }) {
  if (!signal) return null;
  const score = signal.score ?? 0;
  const levelColor =
    signal.level === 'high' || signal.level === 'magas'
      ? 'text-destructive'
      : signal.level === 'low' || signal.level === 'alacsony'
        ? 'text-secondary'
        : 'text-primary';

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="text-primary/70">{icon}</div>
          <CardTitle className="text-base">{signal.title ?? '–'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className={`font-semibold ${levelColor}`}>{signal.level ?? '–'}</span>
          <span className="font-mono font-bold text-foreground">{score}/100</span>
        </div>
        <Progress value={score} className="h-2" />
        {signal.interpretation && (
          <p className="text-xs text-muted-foreground leading-relaxed">{signal.interpretation}</p>
        )}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70">
          {signal.confidence != null && <span>Confidence: {signal.confidence}%</span>}
          {signal.updated_at && <span>{new Date(signal.updated_at).toLocaleDateString('hu-HU')}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketIntelligenceSection() {
  const { summary, context, pressure, turnover, loading, error } = useMarketIntelligence();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="animate-spin h-5 w-5" />
        <span className="text-sm">Market Intelligence betöltése…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm">Piaci adatok jelenleg nem elérhetők.</span>
        </CardContent>
      </Card>
    );
  }

  const o = summary?.overview;

  return (
    <section className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          EV DIAG Market Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Valós idejű piaci listing-, ármozgási- és készletforgási jelek az értékbecslés támogatására.
        </p>
      </div>

      {/* A) Market Summary Grid */}
      {o && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard label="Aktív hirdetések" value={fmt(o.active_listings)} icon={<Layers className="h-4 w-4" />} />
          <MetricCard label="Összes hirdetés" value={fmt(o.total_listings)} />
          <MetricCard label="Kereskedők" value={fmt(o.unique_dealers)} />
          <MetricCard label="Források" value={fmt(o.unique_sources)} />
          <MetricCard label="Átlagár" value={fmt(o.avg_price_eur, 'eur')} icon={<TrendingUp className="h-4 w-4" />} />
          <MetricCard label="Medián ár" value={fmt(o.median_price_eur, 'eur')} />
          <MetricCard label="Átl. futás" value={fmt(o.avg_mileage_km, 'km')} />
          <MetricCard label="Árcsökk. (7 nap)" value={fmt(o.price_drop_events_last_7d)} />
          <MetricCard label="Árcsökk. (30 nap)" value={fmt(o.price_drop_events_last_30d)} />
          <MetricCard label="Átl. csökkenés (30n)" value={fmt(o.avg_drop_pct_last_30d, 'pct')} />
        </div>
      )}

      {/* B) AutoValue Context */}
      {context && (context.market_summary || context.price_positioning_hint || context.negotiation_room_hint) && (
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary/70" />
              AutoValue Kontextus
            </CardTitle>
            {context.updated_at && (
              <CardDescription className="text-[11px]">
                Frissítve: {new Date(context.updated_at).toLocaleDateString('hu-HU')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {context.market_summary && <p>{context.market_summary}</p>}
            {context.price_positioning_hint && <p>💡 {context.price_positioning_hint}</p>}
            {context.negotiation_room_hint && <p>🤝 {context.negotiation_room_hint}</p>}
          </CardContent>
        </Card>
      )}

      {/* C) Signal Cards */}
      {(pressure || turnover) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignalCard signal={pressure} icon={<Activity className="h-4 w-4" />} />
          <SignalCard signal={turnover} icon={<TrendingUp className="h-4 w-4" />} />
        </div>
      )}
    </section>
  );
}

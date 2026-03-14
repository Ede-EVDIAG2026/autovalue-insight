import { useMarketIntelligence, type VehicleParams } from '@/hooks/useMarketIntelligence';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, BarChart3, TrendingUp, Activity, Layers, Info } from 'lucide-react';
import type { MarketSignal } from '@/types/marketIntelligence';

interface MarketIntelligenceSectionProps {
  vehicle: VehicleParams | null;
}

type Lang = 'HU' | 'EN' | 'DE';

const mi: Record<string, Record<Lang, string>> = {
  market_intelligence_title:    { HU: 'EV DIAG Piaci Intelligencia', EN: 'EV DIAG Market Intelligence', DE: 'EV DIAG Marktintelligenz' },
  market_intelligence_subtitle: { HU: 'Valós idejű piaci listing-, ármozgási- és készletforgási jelek az értékbecslés támogatására', EN: 'Real-time market listing, price movement and inventory turnover signals supporting vehicle valuation', DE: 'Echtzeit-Marktsignale zu Inseraten, Preisbewegungen und Lagerumschlag zur Unterstützung der Fahrzeugbewertung' },
  summary_active_listings:      { HU: 'Aktív hirdetések', EN: 'Active listings', DE: 'Aktive Inserate' },
  summary_total_listings:       { HU: 'Összes hirdetés', EN: 'Total listings', DE: 'Gesamtanzeigen' },
  summary_unique_dealers:       { HU: 'Egyedi kereskedők', EN: 'Unique dealers', DE: 'Einzigartige Händler' },
  summary_unique_sources:       { HU: 'Adatforrások', EN: 'Data sources', DE: 'Datenquellen' },
  summary_avg_price:            { HU: 'Átlagár', EN: 'Average price', DE: 'Durchschnittspreis' },
  summary_median_price:         { HU: 'Medián ár', EN: 'Median price', DE: 'Medianpreis' },
  summary_avg_mileage:          { HU: 'Átlag futásteljesítmény', EN: 'Average mileage', DE: 'Durchschnittliche Laufleistung' },
  summary_price_drops_7d:       { HU: 'Árcsökkentések 7 nap', EN: 'Price drops (7 days)', DE: 'Preisreduzierungen (7 Tage)' },
  summary_price_drops_30d:      { HU: 'Árcsökkentések 30 nap', EN: 'Price drops (30 days)', DE: 'Preisreduzierungen (30 Tage)' },
  summary_avg_drop:             { HU: 'Átlagos árkorrekció', EN: 'Average price drop', DE: 'Durchschnittliche Preisreduktion' },
  autovalue_context_title:      { HU: 'AutoValue piaci kontextus', EN: 'AutoValue market context', DE: 'AutoValue Markt Kontext' },
  signal_market_pressure:       { HU: 'Piaci nyomás', EN: 'Market pressure', DE: 'Marktdruck' },
  signal_inventory_turnover:    { HU: 'Készletforgás', EN: 'Inventory turnover', DE: 'Lagerumschlag' },
  signal_confidence:            { HU: 'Bizonytalanság', EN: 'Confidence', DE: 'Konfidenz' },
  signal_updated:               { HU: 'Frissítve', EN: 'Updated', DE: 'Aktualisiert' },
  loading_text:                 { HU: 'Market Intelligence betöltése…', EN: 'Loading Market Intelligence…', DE: 'Market Intelligence wird geladen…' },
  error_text:                   { HU: 'Piaci adatok jelenleg nem elérhetők.', EN: 'Market data currently unavailable.', DE: 'Marktdaten derzeit nicht verfügbar.' },
};

function useMiT() {
  const { lang } = useLanguage();
  return (key: string) => mi[key]?.[lang as Lang] ?? mi[key]?.EN ?? key;
}

function fmt(n: number | null | undefined, type: 'eur' | 'km' | 'pct' | 'num' = 'num'): string {
  if (n == null) return '–';
  if (type === 'eur') return `€${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;
  if (type === 'km') return `${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })} km`;
  if (type === 'pct') return `${n.toFixed(1)}%`;
  return n.toLocaleString('de-DE');
}

function localeDateStr(iso: string, lang: string) {
  const locale = lang === 'DE' ? 'de-DE' : lang === 'EN' ? 'en-GB' : 'hu-HU';
  return new Date(iso).toLocaleDateString(locale);
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

function SignalCard({ signal, icon, t, lang }: { signal: MarketSignal | null; icon: React.ReactNode; t: (k: string) => string; lang: string }) {
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
          {signal.confidence != null && <span>{t('signal_confidence')}: {signal.confidence}%</span>}
          {signal.updated_at && <span>{t('signal_updated')}: {localeDateStr(signal.updated_at, lang)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketIntelligenceSection({ vehicle }: MarketIntelligenceSectionProps) {
  const { summary, context, pressure, turnover, loading, error } = useMarketIntelligence(vehicle);
  const { lang } = useLanguage();
  const t = useMiT();

  if (!vehicle) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="animate-spin h-5 w-5" />
        <span className="text-sm">{t('loading_text')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm">{t('error_text')}</span>
        </CardContent>
      </Card>
    );
  }

  const o = summary?.overview;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t('market_intelligence_title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('market_intelligence_subtitle')}</p>
      </div>

      {o && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard label={t('summary_active_listings')} value={fmt(o.active_listings)} icon={<Layers className="h-4 w-4" />} />
          <MetricCard label={t('summary_total_listings')} value={fmt(o.total_listings)} />
          <MetricCard label={t('summary_unique_dealers')} value={fmt(o.unique_dealers)} />
          <MetricCard label={t('summary_unique_sources')} value={fmt(o.unique_sources)} />
          <MetricCard label={t('summary_avg_price')} value={fmt(o.avg_price_eur, 'eur')} icon={<TrendingUp className="h-4 w-4" />} />
          <MetricCard label={t('summary_median_price')} value={fmt(o.median_price_eur, 'eur')} />
          <MetricCard label={t('summary_avg_mileage')} value={fmt(o.avg_mileage_km, 'km')} />
          <MetricCard label={t('summary_price_drops_7d')} value={fmt(o.price_drop_events_last_7d)} />
          <MetricCard label={t('summary_price_drops_30d')} value={fmt(o.price_drop_events_last_30d)} />
          <MetricCard label={t('summary_avg_drop')} value={fmt(o.avg_drop_pct_last_30d, 'pct')} />
        </div>
      )}

      {context && (context.market_summary || context.price_positioning_hint || context.negotiation_room_hint) && (
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary/70" />
              {t('autovalue_context_title')}
            </CardTitle>
            {context.updated_at && (
              <CardDescription className="text-[11px]">
                {t('signal_updated')}: {localeDateStr(context.updated_at, lang)}
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

      {(pressure || turnover) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignalCard signal={pressure} icon={<Activity className="h-4 w-4" />} t={t} lang={lang} />
          <SignalCard signal={turnover} icon={<TrendingUp className="h-4 w-4" />} t={t} lang={lang} />
        </div>
      )}
    </section>
  );
}

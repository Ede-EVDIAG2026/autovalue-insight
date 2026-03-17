import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart3, Layers, TrendingUp, Gauge, AlertTriangle, Loader2, ChevronDown, ExternalLink } from 'lucide-react';

const MARKET_API = import.meta?.env?.VITE_MARKET_API ?? 'https://market.evdiag.hu';

interface ComparableListing {
  source: string | null;
  title: string | null;
  listing_url: string | null;
  price_eur: number | null;
  mileage_km: number | null;
  first_reg_year: number | null;
}

interface MarketContextData {
  market_depth: string;
  sample_size: number;
  price_stats: { median_eur: number | null; avg_eur: number | null };
  price_position: { vs_median_pct: number | null; band: string };
  mileage_position: { delta_km: number | null; band: string; market_avg_mileage_km: number | null };
  source_coverage: number;
  fallback_mode: boolean;
  year_match_mode: string;
  comparable_listings?: ComparableListing[];
}

interface Props {
  make: string;
  model: string;
  year: number;
  mileageKm: number;
  fuelType?: string;
  priceEur?: number;
}

const DEPTH_KEY: Record<string, string> = { deep: 'mc_depth_deep', medium: 'mc_depth_medium', thin: 'mc_depth_thin' };
const PRICE_BAND_KEY: Record<string, string> = { below_market: 'mc_band_below', at_market: 'mc_band_at', above_market: 'mc_band_above', unknown: 'mc_band_unknown' };
const MILEAGE_BAND_KEY: Record<string, string> = { lower_mileage: 'mc_mil_lower', average_mileage: 'mc_mil_avg', higher_mileage: 'mc_mil_higher', unknown: 'mc_mil_unknown' };
const PRICE_COLOR: Record<string, string> = { below_market: 'text-secondary', at_market: 'text-primary', above_market: 'text-destructive', unknown: 'text-muted-foreground' };

export default function MarketContextCard({ make, model, year, mileageKm, fuelType, priceEur }: Props) {
  const { tr } = useLanguage();
  const [data, setData] = useState<MarketContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comparablesOpen, setComparablesOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ make, model, year: String(year), mileage_km: String(mileageKm) });
    if (fuelType) params.set('powertrain', fuelType);
    if (priceEur) params.set('price_eur', String(priceEur));

    setLoading(true);
    setError(false);

    fetch(`${MARKET_API}/api/v1/market/autovalue-context?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => {
        const m = json?.market ?? json?.market_context ?? json;
        if (m?.sample_size != null || m?.price_stats) {
          // comparable_listings may live at top level or inside market
          if (!m.comparable_listings && json?.comparable_listings) {
            m.comparable_listings = json.comparable_listings;
          }
          setData(m);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [make, model, year, mileageKm, fuelType, priceEur]);

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{tr('mc_loading')}</span>
      </div>
    );
  }

  if (error || !data) return null;

  const median = data.price_stats?.median_eur;
  const band = data.price_position?.band ?? 'unknown';
  const vsPct = data.price_position?.vs_median_pct;
  const milBand = data.mileage_position?.band ?? 'unknown';
  const deltaKm = data.mileage_position?.delta_km;
  const comparables = data.comparable_listings?.filter(c => c.title || c.price_eur) ?? [];

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-bold text-foreground text-lg mb-1 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        {tr('mc_title')}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">{tr('mc_subtitle')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Market depth */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <Layers className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{tr('mc_label_depth')}</p>
          <p className="text-sm font-semibold text-foreground mt-1">{tr(DEPTH_KEY[data.market_depth] ?? 'mc_depth_thin')}</p>
        </div>

        {/* Sample size */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">{tr('mc_label_sample')}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{data.sample_size ?? '–'}</p>
        </div>

        {/* Source coverage */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">{tr('mc_label_coverage')}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{data.source_coverage != null ? `${data.source_coverage}%` : '–'}</p>
        </div>

        {/* Median price */}
        {median != null && (
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{tr('mc_label_median')}</p>
            <p className="text-lg font-bold text-foreground mt-1">€{median.toLocaleString('de-DE')}</p>
          </div>
        )}

        {/* Price band */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">{tr('mc_label_price_pos')}</p>
          <Badge variant="outline" className={`mt-1 ${PRICE_COLOR[band] ?? ''}`}>
            {tr(PRICE_BAND_KEY[band] ?? 'mc_band_unknown')}
          </Badge>
          {vsPct != null && (
            <p className={`text-xs mt-1 ${PRICE_COLOR[band]}`}>
              {vsPct > 0 ? '+' : ''}{vsPct.toFixed(1)}% {tr('mc_vs_median')}
            </p>
          )}
        </div>

        {/* Mileage band */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <Gauge className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{tr('mc_label_mil_pos')}</p>
          <Badge variant="outline" className="mt-1">
            {tr(MILEAGE_BAND_KEY[milBand] ?? 'mc_mil_unknown')}
          </Badge>
          {deltaKm != null && (
            <p className="text-xs text-muted-foreground mt-1">
              {deltaKm > 0 ? '+' : ''}{(deltaKm / 1000).toFixed(0)}k km {tr('mc_vs_avg')}
            </p>
          )}
        </div>
      </div>

      {data.fallback_mode && (
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-destructive/70 shrink-0 mt-0.5" />
          {tr('mc_fallback')}
        </div>
      )}

      {/* Comparable listings collapsible */}
      {comparables.length > 0 && (
        <Collapsible open={comparablesOpen} onOpenChange={setComparablesOpen} className="mt-4">
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-semibold text-foreground hover:text-primary transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform ${comparablesOpen ? 'rotate-180' : ''}`} />
            {tr('mc_comparables')} ({comparables.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">{tr('mc_col_source')}</th>
                    <th className="text-left px-3 py-2 font-medium">{tr('mc_col_title')}</th>
                    <th className="text-right px-3 py-2 font-medium">{tr('mc_col_year')}</th>
                    <th className="text-right px-3 py-2 font-medium">{tr('mc_col_mileage')}</th>
                    <th className="text-right px-3 py-2 font-medium">{tr('mc_col_price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{c.source ?? '–'}</td>
                      <td className="px-3 py-2 text-foreground max-w-[200px] truncate">
                        {c.listing_url ? (
                          <a href={c.listing_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                            {c.title ?? '–'}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          c.title ?? '–'
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">{c.first_reg_year ?? '–'}</td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {c.mileage_km != null ? `${(c.mileage_km / 1000).toFixed(0)}k km` : '–'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">
                        {c.price_eur != null ? `€${c.price_eur.toLocaleString('de-DE')}` : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

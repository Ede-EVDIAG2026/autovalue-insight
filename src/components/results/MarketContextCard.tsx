import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Layers, TrendingUp, Gauge, AlertTriangle, Loader2 } from 'lucide-react';

const MARKET_API = import.meta?.env?.VITE_MARKET_API ?? 'https://market.evdiag.hu';

interface MarketContextData {
  market_depth: string;
  sample_size: number;
  price_stats: { median_eur: number | null; avg_eur: number | null };
  price_position: { vs_median_pct: number | null; band: string };
  mileage_position: { delta_km: number | null; band: string; market_avg_mileage_km: number | null };
  source_coverage: number;
  fallback_mode: boolean;
  year_match_mode: string;
}

interface Props {
  make: string;
  model: string;
  year: number;
  mileageKm: number;
  fuelType?: string;
  priceEur?: number;
}

const DEPTH: Record<string, string> = { deep: 'Mély piac', medium: 'Közepes piac', thin: 'Vékony piac' };
const PRICE_BAND: Record<string, string> = { below_market: 'Alulárazott', at_market: 'Piaci ár', above_market: 'Túlárazott', unknown: 'Nincs adat' };
const MILEAGE_BAND: Record<string, string> = { lower_mileage: 'Átlag alatti futás', average_mileage: 'Átlagos futás', higher_mileage: 'Átlag feletti futás', unknown: 'Nincs adat' };

const PRICE_COLOR: Record<string, string> = { below_market: 'text-secondary', at_market: 'text-primary', above_market: 'text-destructive', unknown: 'text-muted-foreground' };

export default function MarketContextCard({ make, model, year, mileageKm, fuelType, priceEur }: Props) {
  const [data, setData] = useState<MarketContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        <span className="text-sm">Piaci kontextus betöltése…</span>
      </div>
    );
  }

  if (error || !data) return null;

  const median = data.price_stats?.median_eur;
  const band = data.price_position?.band ?? 'unknown';
  const vsPct = data.price_position?.vs_median_pct;
  const milBand = data.mileage_position?.band ?? 'unknown';
  const deltaKm = data.mileage_position?.delta_km;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        Piaci intelligencia
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Market depth */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <Layers className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Piaci mélység</p>
          <p className="text-sm font-semibold text-foreground mt-1">{DEPTH[data.market_depth] ?? data.market_depth}</p>
        </div>

        {/* Sample size */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">Minta méret</p>
          <p className="text-2xl font-bold text-foreground mt-1">{data.sample_size ?? '–'}</p>
        </div>

        {/* Source coverage */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">Forrás lefedettség</p>
          <p className="text-2xl font-bold text-foreground mt-1">{data.source_coverage != null ? `${data.source_coverage}%` : '–'}</p>
        </div>

        {/* Median price */}
        {median != null && (
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Medián piaci ár</p>
            <p className="text-lg font-bold text-foreground mt-1">€{median.toLocaleString('de-DE')}</p>
          </div>
        )}

        {/* Price band */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">Ár pozíció</p>
          <Badge variant="outline" className={`mt-1 ${PRICE_COLOR[band] ?? ''}`}>
            {PRICE_BAND[band] ?? band}
          </Badge>
          {vsPct != null && (
            <p className={`text-xs mt-1 ${PRICE_COLOR[band]}`}>
              {vsPct > 0 ? '+' : ''}{vsPct.toFixed(1)}% vs medián
            </p>
          )}
        </div>

        {/* Mileage band */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <Gauge className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Futás pozíció</p>
          <Badge variant="outline" className="mt-1">{MILEAGE_BAND[milBand] ?? milBand}</Badge>
          {deltaKm != null && (
            <p className="text-xs text-muted-foreground mt-1">
              {deltaKm > 0 ? '+' : ''}{(deltaKm / 1000).toFixed(0)}k km vs átlag
            </p>
          )}
        </div>
      </div>

      {data.fallback_mode && (
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-destructive/70 shrink-0 mt-0.5" />
          Kevés azonos évjáratú találat, ezért a piaci kontextus modellszintű mintából készült.
        </div>
      )}
    </div>
  );
}

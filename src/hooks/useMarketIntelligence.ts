import { useState, useEffect } from 'react';
import type { FrontendSummary, AutoValueContext, MarketSignal } from '@/types/marketIntelligence';

const MARKET_API = 'https://market.evdiag.hu';

export interface VehicleParams {
  make: string;
  model: string;
  year: string;
  mileage: string;
  country: string;
}

async function safeFetch<T>(url: string, timeoutMs = 10000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      mode: 'cors',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function useMarketIntelligence(vehicle: VehicleParams | null) {
  const [summary, setSummary] = useState<FrontendSummary | null>(null);
  const [context, setContext] = useState<AutoValueContext | null>(null);
  const [pressure, setPressure] = useState<MarketSignal | null>(null);
  const [turnover, setTurnover] = useState<MarketSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!vehicle) {
      setSummary(null);
      setContext(null);
      setPressure(null);
      setTurnover(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage_km: vehicle.mileage,
      country: vehicle.country,
    });

    const qs = params.toString();

    safeFetch<any>(`${MARKET_API}/api/v1/market/autovalue-context?${qs}`)
      .then((cv) => {
        if (cancelled) return;

        // Derive FrontendSummary overview from autovalue-context stats
        if (cv?.stats) {
          const s = cv.stats;
          const d = cv.price_drop_summary;
          setSummary({
            overview: {
              active_listings: s.active_listings ?? null,
              total_listings: s.total_listings ?? null,
              unique_dealers: null,
              unique_sources: null,
              avg_price_eur: s.avg_price_eur != null ? parseFloat(String(s.avg_price_eur)) : null,
              median_price_eur: s.median_price_eur ?? null,
              avg_mileage_km: s.avg_mileage_km != null ? parseFloat(String(s.avg_mileage_km)) : null,
              price_drop_events_last_7d: null,
              price_drop_events_last_30d: d?.drop_count ?? null,
              avg_drop_pct_last_30d: d?.avg_drop_pct != null ? parseFloat(String(d.avg_drop_pct)) : null,
            },
          });
        } else {
          setSummary(null);
        }

        // Extract market context hints
        if (cv?.market_context) {
          const mc = cv.market_context;
          setContext({
            market_summary: mc.listing_count != null
              ? `${mc.active_listing_count ?? mc.listing_count} aktív hirdetés, medián: €${mc.market_price_center?.toLocaleString('de-DE') ?? '–'}, P25–P75: €${mc.market_price_low?.toLocaleString('de-DE') ?? '–'} – €${mc.market_price_high?.toLocaleString('de-DE') ?? '–'}`
              : null,
            price_positioning_hint: mc.pricing_confidence ? `Pricing confidence: ${mc.pricing_confidence}` : null,
            negotiation_room_hint: mc.avg_drop_pct != null ? `Átlagos árcsökkentés: ${parseFloat(String(mc.avg_drop_pct)).toFixed(1)}%` : null,
            updated_at: null,
          });
        } else {
          setContext(null);
        }

        // Use embedded signals from autovalue-context (consistent field names)
        if (cv?.signals?.market_pressure) {
          const mp = cv.signals.market_pressure;
          setPressure({
            title: 'Piaci nyomás',
            score: mp.score ?? null,
            level: mp.band ?? null,
            interpretation: `${mp.drop_event_count ?? 0} árcsökkentés, ${mp.listing_count ?? 0} hirdetés`,
            confidence: null,
            updated_at: null,
          });
        } else {
          setPressure(null);
        }

        if (cv?.signals?.inventory_turnover) {
          const it = cv.signals.inventory_turnover;
          setTurnover({
            title: 'Készletforgás',
            score: it.score ?? null,
            level: it.band ?? null,
            interpretation: `${it.sample_size ?? 0} minta alapján`,
            confidence: null,
            updated_at: null,
          });
        } else {
          setTurnover(null);
        }

        if (!cv) setError(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [vehicle?.make, vehicle?.model, vehicle?.year, vehicle?.mileage, vehicle?.country]);

  return { summary, context, pressure, turnover, loading, error };
}

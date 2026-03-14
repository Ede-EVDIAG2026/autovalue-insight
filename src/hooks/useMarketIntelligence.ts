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

    Promise.allSettled([
      safeFetch<FrontendSummary>(`${MARKET_API}/api/v1/market/context?${qs}`),
      safeFetch<AutoValueContext>(`${MARKET_API}/api/v1/market/autovalue-context?${qs}`),
      safeFetch<MarketSignal>(`${MARKET_API}/api/v1/market/signals/market-pressure?${qs}`),
      safeFetch<MarketSignal>(`${MARKET_API}/api/v1/market/signals/inventory-turnover?${qs}`),
    ]).then(([s, c, p, t]) => {
      if (cancelled) return;
      const sv = s.status === 'fulfilled' ? s.value : null;
      const cv = c.status === 'fulfilled' ? c.value : null;
      const pv = p.status === 'fulfilled' ? p.value : null;
      const tv = t.status === 'fulfilled' ? t.value : null;

      setSummary(sv);
      setContext(cv);
      setPressure(pv);
      setTurnover(tv);

      if (!sv && !cv && !pv && !tv) setError(true);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [vehicle?.make, vehicle?.model, vehicle?.year, vehicle?.mileage, vehicle?.country]);

  return { summary, context, pressure, turnover, loading, error };
}

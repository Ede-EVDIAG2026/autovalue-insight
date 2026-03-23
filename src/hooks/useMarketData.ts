const BASE = "https://api.evdiag.hu";

export interface AS24Market {
  found: boolean;
  dataPoints: number;
  confidence: number;
  snapshotDate: string;
  low: number | null;
  median: number | null;
  high: number | null;
  avg: number | null;
  marketSpread: number;
  liquidityScore: number;
  daysToSell: number;
  avgMileageKm: number | null;
  avgFirstRegYear: number | null;
}

export async function fetchAS24(
  brand: string,
  model: string,
  year?: number,
  country?: string
): Promise<AS24Market | null> {
  try {
    const p = new URLSearchParams({ brand, model });
    if (year) p.set("year", String(year));
    if (country) p.set("country", country);
    const r = await fetch(`${BASE}/market/as24/lookup?${p}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.found)
      return {
        found: false,
        dataPoints: 0,
        confidence: 0,
        snapshotDate: "",
        low: null,
        median: null,
        high: null,
        avg: null,
        marketSpread: 0,
        liquidityScore: 0,
        daysToSell: 60,
        avgMileageKm: null,
        avgFirstRegYear: null,
      };
    return {
      found: true,
      dataPoints: d.data_points,
      confidence: d.confidence,
      snapshotDate: d.snapshot_date,
      low: d.market?.low_eur ?? null,
      median: d.market?.median_eur ?? null,
      high: d.market?.high_eur ?? null,
      avg: d.market?.avg_eur ?? null,
      marketSpread: d.market?.market_spread ?? 0,
      liquidityScore: d.liquidity?.score ?? 0,
      daysToSell: d.liquidity?.days_to_sell ?? 60,
      avgMileageKm: d.usage?.avg_mileage_km ?? null,
      avgFirstRegYear: d.usage?.avg_first_reg_year ?? null,
    };
  } catch {
    return null;
  }
}

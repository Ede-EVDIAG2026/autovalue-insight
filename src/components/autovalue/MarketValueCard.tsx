import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info, AlertTriangle } from 'lucide-react';
import { MARKET_API } from '@/lib/marketApi';

/* ─── Types ─── */
export interface PriceStats {
  min_eur: number | null;
  p25_eur: number | null;
  median_eur: number | null;
  p75_eur: number | null;
  max_eur: number | null;
  avg_eur: number | null;
}

export interface PricePosition {
  input_price_eur: number | null;
  vs_median_pct: number | null;
  band: 'below_market' | 'at_market' | 'above_market' | 'unknown';
}

export interface MileagePosition {
  input_mileage_km: number | null;
  market_avg_mileage_km: number | null;
  delta_km: number | null;
  band: 'lower_mileage' | 'average_mileage' | 'higher_mileage' | 'unknown';
}

export interface ComparableListing {
  source: string | null;
  title: string | null;
  listing_url: string | null;
  price_eur: number | null;
  mileage_km: number | null;
  first_reg_year: number | null;
}

export interface YearDistribution {
  year: number;
  count: number;
}

export interface MarketValuationResponse {
  price_stats: PriceStats;
  data_points: number;
  price_position: PricePosition;
  mileage_position: MileagePosition;
  comparable_listings: ComparableListing[];
  year_distribution: YearDistribution[];
  fallback_mode: boolean;
}

export interface VehicleQueryParams {
  make: string;
  model: string;
  year: number;
  powertrain: string;
  mileage_km: number;
  price_eur?: number;
}

/* ─── Fetch helper ─── */
async function fetchMarketValuation(params: VehicleQueryParams): Promise<MarketValuationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const qs = new URLSearchParams({
    make: params.make,
    model: params.model,
    year: String(params.year),
    powertrain: params.powertrain,
    mileage_km: String(params.mileage_km),
  });
  if (params.price_eur && params.price_eur > 0) {
    qs.set('price_eur', String(params.price_eur));
  }

  try {
    const res = await fetch(`${MARKET_API}/api/v1/market/valuation?${qs.toString()}`, {
      mode: 'cors',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ─── Helpers ─── */
const fmt = (v: number | null | undefined) =>
  v != null
    ? new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
    : '–';

const fmtKm = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('hu-HU').format(v) + ' km' : '–';

/* ─── Band label maps ─── */
const PRICE_BAND_LABELS: Record<string, string> = {
  below_market: 'ALULÁRAZOTT',
  at_market: 'PIACI ÁR',
  above_market: 'TÚLÁRAZOTT',
  unknown: 'NINCS ADAT',
};

const MILEAGE_BAND_LABELS: Record<string, string> = {
  lower_mileage: 'ALACSONY FUTÁS',
  average_mileage: 'ÁTLAGOS FUTÁS',
  higher_mileage: 'MAGAS FUTÁS',
  unknown: 'NINCS ADAT',
};

/* ─── Sub-components ─── */

const PriceBand = ({ p25, median, p75, priceEur }: { p25: number; median: number; p75: number; priceEur: number }) => {
  const range = p75 - p25;
  let pct: number;
  let isOutOfRange = false;

  if (priceEur < p25) {
    pct = 0;
    isOutOfRange = true;
  } else if (priceEur > p75) {
    pct = 100;
    isOutOfRange = true;
  } else {
    pct = range > 0 ? ((priceEur - p25) / range) * 100 : 50;
  }

  return (
    <div className="space-y-2">
      <div className="relative h-3 rounded-full" style={{ backgroundColor: '#d4cfca' }}>
        <div className="absolute inset-y-0 left-0 rounded-full w-full" style={{ background: 'linear-gradient(90deg, #00875A, #00875A)' }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all"
          style={{
            left: `calc(${pct}% - 10px)`,
            backgroundColor: isOutOfRange ? '#ef4444' : '#00875A',
          }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: '#6b6b6b' }}>
        <span>P25: {fmt(p25)}</span>
        <span className="font-semibold">Medián: {fmt(median)}</span>
        <span>P75: {fmt(p75)}</span>
      </div>
    </div>
  );
};

const PositionBadge = ({ pos }: { pos: PricePosition }) => {
  const label = PRICE_BAND_LABELS[pos.band] || 'NINCS ADAT';
  const styles: Record<string, { bg: string; text: string }> = {
    'ALULÁRAZOTT': { bg: '#00875A', text: '#fff' },
    'PIACI ÁR': { bg: '#3b82f6', text: '#fff' },
    'TÚLÁRAZOTT': { bg: '#f97316', text: '#fff' },
    'NINCS ADAT': { bg: '#9ca3af', text: '#fff' },
  };
  const s = styles[label] || styles['NINCS ADAT'];

  let detail = '';
  if (pos.vs_median_pct != null && pos.band !== 'unknown') {
    const pct = Math.abs(pos.vs_median_pct).toFixed(1);
    if (pos.band === 'below_market') {
      detail = `▼ ${pct}% a mediánhoz képest`;
    } else if (pos.band === 'above_market') {
      detail = `▲ ${pct}% a mediánhoz képest`;
    } else {
      detail = '≈ piaci áron';
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
        style={{ backgroundColor: s.bg, color: s.text }}
      >
        {label}
      </span>
      {detail && <span className="text-sm" style={{ color: '#4a4a4a' }}>{detail}</span>}
    </div>
  );
};

const MileageBadge = ({ position }: { position: MileagePosition }) => {
  const label = MILEAGE_BAND_LABELS[position.band] || 'NINCS ADAT';
  const map: Record<string, { bg: string; color: string }> = {
    'ALACSONY FUTÁS': { bg: '#00875A', color: '#fff' },
    'ÁTLAGOS FUTÁS': { bg: '#9ca3af', color: '#fff' },
    'MAGAS FUTÁS': { bg: '#f97316', color: '#fff' },
    'NINCS ADAT': { bg: '#9ca3af', color: '#fff' },
  };
  const s = map[label] || map['NINCS ADAT'];

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
};

/* ─── Main component ─── */

interface MarketValueCardProps {
  data?: MarketValuationResponse | null;
  loading?: boolean;
  error?: string | null;
  priceEur: number;
  queryYear: number;
  vehicleQuery?: VehicleQueryParams;
}

const HEADER_TITLE = '📊 Piaci Összehasonlítás';
const HEADER_BG = '#EBE6DD';

const MarketValueCard = ({ data: externalData, loading: externalLoading, error: externalError, priceEur, queryYear, vehicleQuery }: MarketValueCardProps) => {
  const [internalData, setInternalData] = useState<MarketValuationResponse | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleQuery) return;

    const doFetch = async () => {
      setInternalLoading(true);
      setInternalError(null);
      try {
        const json = await fetchMarketValuation(vehicleQuery);
        setInternalData(json);
      } catch (e: any) {
        if (e.name === 'AbortError') {
          setInternalError('A kérés időtúllépés miatt megszakadt.');
        } else {
          setInternalError(e.message || 'Ismeretlen hiba');
        }
      } finally {
        setInternalLoading(false);
      }
    };

    doFetch();
  }, [vehicleQuery?.make, vehicleQuery?.model, vehicleQuery?.year, vehicleQuery?.powertrain, vehicleQuery?.mileage_km, vehicleQuery?.price_eur]);

  const data = externalData !== undefined ? externalData : internalData;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;

  if (loading) {
    return (
      <Card className="border-0 shadow-lg" style={{ backgroundColor: '#fff' }}>
        <CardHeader style={{ backgroundColor: HEADER_BG, borderRadius: '0.5rem 0.5rem 0 0' }}>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg" style={{ backgroundColor: '#fff' }}>
        <CardHeader style={{ backgroundColor: HEADER_BG, borderRadius: '0.5rem 0.5rem 0 0' }}>
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#1a1a1a' }}>
            {HEADER_TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#f5f5f4', color: '#6b6b6b' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#9ca3af' }} />
            <p className="text-sm">Piaci adatok jelenleg nem elérhetők.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.data_points === 0) {
    return (
      <Card className="border-0 shadow-lg" style={{ backgroundColor: '#fff' }}>
        <CardHeader style={{ backgroundColor: HEADER_BG, borderRadius: '0.5rem 0.5rem 0 0' }}>
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#1a1a1a' }}>
            {HEADER_TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm" style={{ color: '#6b6b6b' }}>Ehhez a járműhöz még nincs elegendő piaci adat.</p>
        </CardContent>
      </Card>
    );
  }

  const ps = data.price_stats;
  const listings = (data.comparable_listings || []).slice(0, 5);

  const chartData = (data.year_distribution || []).map(d => ({
    year: d.year.toString(),
    count: d.count,
    isQuery: d.year === queryYear,
  }));

  return (
    <Card className="border-0 shadow-lg overflow-hidden" style={{ backgroundColor: '#fff' }}>
      <CardHeader className="pb-3" style={{ backgroundColor: HEADER_BG }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#1a1a1a' }}>
            {HEADER_TITLE}
          </CardTitle>
          <Badge className="text-xs font-medium" style={{ backgroundColor: '#00875A', color: '#fff', border: 'none' }}>
            {data.data_points} hasonló hirdetés alapján
          </Badge>
        </div>
        {data.fallback_mode && (
          <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#7c7c7c' }}>
            <Info className="h-3.5 w-3.5" />
            Kevés azonos évjáratú találat, ezért a piaci kontextus modellszintű mintából készült.
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Price band */}
        {ps.p25_eur != null && ps.median_eur != null && ps.p75_eur != null && (
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#1a1a1a' }}>Ár elhelyezkedés a piacon</p>
            <PriceBand p25={ps.p25_eur} median={ps.median_eur} p75={ps.p75_eur} priceEur={priceEur} />
          </div>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-3">
          <PositionBadge pos={data.price_position} />
          <MileageBadge position={data.mileage_position} />
        </div>

        {/* Comparable listings */}
        {listings.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#1a1a1a' }}>Összehasonlítható hirdetések</p>
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#e5e0d8' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: HEADER_BG }}>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Forrás</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Cím</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Évjárat</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Km</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Ár EUR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((l, i) => (
                    <TableRow
                      key={i}
                      className={l.listing_url ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                      onClick={() => l.listing_url && window.open(l.listing_url, '_blank', 'noopener')}
                    >
                      <TableCell className="text-sm">{l.source ?? '–'}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{l.title ?? '–'}</TableCell>
                      <TableCell className="text-sm">{l.first_reg_year ?? '–'}</TableCell>
                      <TableCell className="text-sm">{fmtKm(l.mileage_km)}</TableCell>
                      <TableCell className="text-sm font-semibold">{fmt(l.price_eur)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Year distribution chart */}
        {chartData.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#1a1a1a' }}>Évjárat eloszlás</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6b6b6b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b6b6b' }} width={30} />
                  <Tooltip
                    formatter={(value: number) => [`${value} db`, 'Darabszám']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.isQuery ? '#005a3a' : '#00875A'}
                        stroke={entry.isQuery ? '#003d28' : 'none'}
                        strokeWidth={entry.isQuery ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketValueCard;

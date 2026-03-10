import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info } from 'lucide-react';

/* ─── Types ─── */
export interface PriceStats {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  avg: number;
  currency: string;
}

export interface ComparableListing {
  year: number;
  first_registration: string;
  mileage_km: number;
  powertrain: string;
  price_eur: number;
  country: string;
  url: string;
}

export interface PricePosition {
  label: 'ALULÉRTÉKELT' | 'PIACI AR' | 'TULARAZOTT';
  diff_eur: number;
  diff_pct: number;
}

export interface YearDistribution {
  year: number;
  count: number;
}

export interface MarketValuationResponse {
  price_stats: PriceStats;
  data_points: number;
  price_position: PricePosition;
  mileage_position: 'ALACSONY FUTAS' | 'ATLAGOS FUTAS' | 'MAGAS FUTAS';
  comparable_listings: ComparableListing[];
  year_distribution: YearDistribution[];
  fallback_mode: boolean;
}

/* ─── Helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtKm = (v: number) =>
  new Intl.NumberFormat('hu-HU').format(v) + ' km';

/* ─── Sub-components ─── */

const PriceBand = ({ p10, median, p90, priceEur }: { p10: number; median: number; p90: number; priceEur: number }) => {
  const range = p90 - p10;
  let pct: number;
  let isOutOfRange = false;

  if (priceEur < p10) {
    pct = 0;
    isOutOfRange = true;
  } else if (priceEur > p90) {
    pct = 100;
    isOutOfRange = true;
  } else {
    pct = range > 0 ? ((priceEur - p10) / range) * 100 : 50;
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
        <span>p10: {fmt(p10)}</span>
        <span className="font-semibold">Medián: {fmt(median)}</span>
        <span>p90: {fmt(p90)}</span>
      </div>
    </div>
  );
};

const PositionBadge = ({ pos }: { pos: PricePosition }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    'ALULÉRTÉKELT': { bg: '#00875A', text: '#fff' },
    'PIACI AR': { bg: '#3b82f6', text: '#fff' },
    'TULARAZOTT': { bg: '#f97316', text: '#fff' },
  };
  const s = styles[pos.label] || styles['PIACI AR'];

  let detail = '';
  if (pos.label === 'ALULÉRTÉKELT') {
    detail = `▼ ${fmt(Math.abs(pos.diff_eur))} / ${Math.abs(pos.diff_pct).toFixed(1)}% a mediánhoz képest`;
  } else if (pos.label === 'TULARAZOTT') {
    detail = `▲ ${fmt(Math.abs(pos.diff_eur))} / ${Math.abs(pos.diff_pct).toFixed(1)}% a mediánhoz képest`;
  } else {
    detail = '≈ piaci áron';
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
        style={{ backgroundColor: s.bg, color: s.text }}
      >
        {pos.label}
      </span>
      <span className="text-sm" style={{ color: '#4a4a4a' }}>{detail}</span>
    </div>
  );
};

const MileageBadge = ({ position }: { position: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    'ALACSONY FUTAS': { bg: '#00875A', color: '#fff' },
    'ATLAGOS FUTAS': { bg: '#9ca3af', color: '#fff' },
    'MAGAS FUTAS': { bg: '#f97316', color: '#fff' },
  };
  const s = map[position] || map['ATLAGOS FUTAS'];

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {position}
    </span>
  );
};

/* ─── Main component ─── */

interface MarketValueCardProps {
  data: MarketValuationResponse | null;
  loading: boolean;
  error: string | null;
  priceEur: number;
  queryYear: number;
}

const HEADER_TITLE = '📊 Piaci Összehasonlítás';
const HEADER_BG = '#EBE6DD';

const MarketValueCard = ({ data, loading, error, priceEur, queryYear }: MarketValueCardProps) => {
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
          <p className="text-sm" style={{ color: '#6b6b6b' }}>Hiba történt a piaci adatok lekérésekor.</p>
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
  const closestListing = listings.length > 0
    ? listings.reduce((prev, curr) => Math.abs(curr.price_eur - priceEur) < Math.abs(prev.price_eur - priceEur) ? curr : prev)
    : null;

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
            Tágabb keresési tartomány alapján
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Price band */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: '#1a1a1a' }}>Ár elhelyezkedés a piacon</p>
          <PriceBand p10={ps.p10} median={ps.median} p90={ps.p90} priceEur={priceEur} />
        </div>

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
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Évjárat</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Első forg.</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Km</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Hajtáslánc</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Ár EUR</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>Ország</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((l, i) => {
                    const isClosest = closestListing && l.url === closestListing.url;
                    return (
                      <TableRow
                        key={i}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        style={isClosest ? { borderLeft: '3px solid #00875A', backgroundColor: '#f0fdf4' } : {}}
                        onClick={() => window.open(l.url, '_blank', 'noopener')}
                      >
                        <TableCell className="text-sm">{l.year}</TableCell>
                        <TableCell className="text-sm">{l.first_registration}</TableCell>
                        <TableCell className="text-sm">{fmtKm(l.mileage_km)}</TableCell>
                        <TableCell className="text-sm">{l.powertrain}</TableCell>
                        <TableCell className="text-sm font-semibold">{fmt(l.price_eur)}</TableCell>
                        <TableCell className="text-sm">{l.country}</TableCell>
                      </TableRow>
                    );
                  })}
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

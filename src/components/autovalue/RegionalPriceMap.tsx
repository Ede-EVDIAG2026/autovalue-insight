import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

const BASE = 'https://api.evdiag.hu';

const FLAG: Record<string, string> = {
  DE: '🇩🇪', NL: '🇳🇱', BE: '🇧🇪', FR: '🇫🇷', IT: '🇮🇹',
  ES: '🇪🇸', AT: '🇦🇹', CH: '🇨🇭', PL: '🇵🇱', CZ: '🇨🇿',
  HU: '🇭🇺', SE: '🇸🇪', DK: '🇩🇰', NO: '🇳🇴', FI: '🇫🇮',
  PT: '🇵🇹', RO: '🇷🇴', LU: '🇱🇺', SK: '🇸🇰', HR: '🇭🇷',
  SI: '🇸🇮', BG: '🇧🇬', IE: '🇮🇪', GR: '🇬🇷', GB: '🇬🇧',
  LT: '🇱🇹', LV: '🇱🇻', EE: '🇪🇪',
};

interface CountryData {
  country_code: string;
  country_name: string;
  listings: number;
  median_eur: number;
  avg_eur: number;
  min_eur: number;
  max_eur: number;
  avg_km: number;
}

interface RegionData {
  country_code: string;
  country_name: string;
  region: string;
  region_short: string;
  macro_region: string;
  listings: number;
  median_eur: number;
}

interface CityData {
  city: string;
  country_code: string;
  listings: number;
  median_eur: number;
}

interface RegionalResponse {
  by_country: CountryData[];
  by_region: RegionData[];
  top_cities: CityData[];
}

const fmt = (v: number) => `€${v.toLocaleString('hu-HU')}`;

interface Props {
  brand: string;
  model: string;
  year?: number;
}

export default function RegionalPriceMap({ brand, model, year }: Props) {
  const [data, setData] = useState<RegionalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);

  useEffect(() => {
    if (!brand || !model) return;
    setLoading(true);
    setError(false);
    const p = new URLSearchParams({ brand, model });
    if (year) p.set('year', String(year));
    fetch(`${BASE}/market/as24/regional?${p}`, { signal: AbortSignal.timeout(10000) })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [brand, model, year]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !data || !data.by_country?.length) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">🌍</div>
        <div className="text-sm font-semibold text-muted-foreground">Nincs elegendő regionális adat</div>
        <div className="text-xs text-muted-foreground/70 mt-1">Ehhez a járműhöz jelenleg nem áll rendelkezésre regionális piaci adat.</div>
      </div>
    );
  }

  const countries = [...data.by_country].sort((a, b) => b.listings - a.listings);
  const topCode = countries[0]?.country_code;
  const globalMax = Math.max(...countries.map(c => c.max_eur));
  const globalMin = Math.min(...countries.map(c => c.min_eur));
  const range = globalMax - globalMin || 1;

  return (
    <div className="space-y-4">
      {/* Country cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {countries.map((c) => {
          const isTop = c.country_code === topCode;
          const barLeft = ((c.min_eur - globalMin) / range) * 100;
          const barWidth = ((c.max_eur - c.min_eur) / range) * 100;
          const medianPos = ((c.median_eur - globalMin) / range) * 100;

          return (
            <Card
              key={c.country_code}
              className={`relative overflow-hidden transition-colors ${isTop ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              {isTop && (
                <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5">
                  Legtöbb adat
                </Badge>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{FLAG[c.country_code] || '🏳️'}</span>
                  <span className="text-sm font-semibold text-foreground">{c.country_name}</span>
                </div>

                <div className="text-xl font-bold text-foreground">{fmt(c.median_eur)}</div>
                <div className="text-xs text-muted-foreground">{c.listings} hirdetés</div>

                {/* Min-Max bar */}
                <div className="relative h-2 bg-muted rounded-full mt-2">
                  <div
                    className="absolute h-full bg-primary/30 rounded-full"
                    style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 2)}%` }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-primary rounded-full -translate-x-1/2 top-0"
                    style={{ left: `${medianPos}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{fmt(c.min_eur)}</span>
                  <span>{fmt(c.max_eur)}</span>
                </div>

                {c.avg_km > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Ø {Math.round(c.avg_km / 1000)}k km
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Regional breakdown */}
      {data.by_region?.length > 0 && (
        <Collapsible open={regionsOpen} onOpenChange={setRegionsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-semibold text-foreground py-2 hover:text-primary transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform ${regionsOpen ? 'rotate-180' : ''}`} />
            Regionális bontás ({data.by_region.length})
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {data.by_region.map((r, i) => (
                <div key={`${r.country_code}-${r.region_short}-${i}`} className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{r.region}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] px-1.5">{r.region_short}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{fmt(r.median_eur)}</div>
                    <div className="text-[10px] text-muted-foreground">{r.listings} db</div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Top cities */}
      {data.top_cities?.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">Top városok</div>
          <div className="space-y-1">
            {data.top_cities.slice(0, 10).map((c, i) => (
              <div key={`${c.city}-${i}`} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{FLAG[c.country_code] || '🏳️'}</span>
                  <span className="text-foreground">{c.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{fmt(c.median_eur)}</span>
                  <span className="text-[10px] text-muted-foreground">{c.listings} db</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

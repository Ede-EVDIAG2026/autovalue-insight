import { useState, useEffect, useMemo } from 'react';
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

const COUNTRY_CENTER: Record<string, { lat: number; lng: number; zoom: number }> = {
  DE: { lat: 51.1657, lng: 10.4515, zoom: 6 },
  NL: { lat: 52.1326, lng: 5.2913, zoom: 7 },
  BE: { lat: 50.5039, lng: 4.4699, zoom: 7 },
  FR: { lat: 46.2276, lng: 2.2137, zoom: 6 },
  IT: { lat: 41.8719, lng: 12.5674, zoom: 6 },
  ES: { lat: 40.4637, lng: -3.7492, zoom: 6 },
  AT: { lat: 47.5162, lng: 14.5501, zoom: 7 },
  CH: { lat: 46.8182, lng: 8.2275, zoom: 7 },
  PL: { lat: 51.9194, lng: 19.1451, zoom: 6 },
  CZ: { lat: 49.8175, lng: 15.4730, zoom: 7 },
  HU: { lat: 47.1625, lng: 19.5033, zoom: 7 },
  SE: { lat: 60.1282, lng: 18.6435, zoom: 5 },
  DK: { lat: 56.2639, lng: 9.5018, zoom: 7 },
  NO: { lat: 60.472, lng: 8.4689, zoom: 5 },
  FI: { lat: 61.9241, lng: 25.7482, zoom: 5 },
  PT: { lat: 39.3999, lng: -8.2245, zoom: 6 },
  RO: { lat: 45.9432, lng: 24.9668, zoom: 6 },
  LU: { lat: 49.8153, lng: 6.1296, zoom: 9 },
  SK: { lat: 48.669, lng: 19.699, zoom: 7 },
  HR: { lat: 45.1, lng: 15.2, zoom: 7 },
  SI: { lat: 46.1512, lng: 14.9955, zoom: 8 },
  BG: { lat: 42.7339, lng: 25.4858, zoom: 7 },
  IE: { lat: 53.1424, lng: -7.6921, zoom: 7 },
  GR: { lat: 39.0742, lng: 21.8243, zoom: 6 },
  GB: { lat: 55.3781, lng: -3.4360, zoom: 6 },
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
  lat?: number;
  lng?: number;
  region?: string;
}

interface RegionalResponse {
  by_country: CountryData[];
  by_region: RegionData[];
  top_cities: CityData[];
}

const fmt = (v: number) => `€${v.toLocaleString('hu-HU')}`;

function buildMapHtml(cities: any[], filterCountry: string | null, isDark: boolean): string {
  const filtered = filterCountry
    ? cities.filter((c: any) => c.country_code === filterCountry && c.lat && c.lng)
    : cities.filter((c: any) => c.lat && c.lng);

  const countryCenter: Record<string, [number, number, number]> = {
    DE: [51.1657, 10.4515, 6], NL: [52.1326, 5.2913, 7],
    BE: [50.5039, 4.4699, 7], FR: [46.2276, 2.2137, 6],
    IT: [41.8719, 12.5674, 6], ES: [40.4637, -3.7492, 6],
    AT: [47.5162, 14.5501, 7], CH: [46.8182, 8.2275, 7],
    PL: [51.9194, 19.1451, 6], CZ: [49.8175, 15.4730, 7],
    HU: [47.1625, 19.5033, 7], SE: [60.1282, 18.6435, 5],
    DK: [56.2639, 9.5018, 7], NO: [60.472, 8.4689, 5],
    FI: [61.9241, 25.7482, 5], PT: [39.3999, -8.2245, 6],
    RO: [45.9432, 24.9668, 6], GB: [55.3781, -3.436, 6],
  };

  const center = filterCountry && countryCenter[filterCountry]
    ? countryCenter[filterCountry]
    : [51.5, 10.0, 4];

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
  const tileAttr = isDark ? '© CartoDB © OpenStreetMap' : '© OpenTopoMap';

  const markers = filtered.map((c: any) => {
    const color = (c.median_eur || 0) < 15000 ? '#22c55e' :
                  (c.median_eur || 0) < 25000 ? '#3b82f6' :
                  (c.median_eur || 0) < 40000 ? '#f59e0b' : '#ef4444';
    const radius = Math.max(8, Math.min(25, (c.listings || 1) * 3));
    const cityName = (c.city || '').replace(/'/g, "\\'");
    const regionLine = c.region ? `<br/><span style="color:#888">${c.region.replace(/'/g, "\\'")}</span>` : '';
    return `L.circleMarker([${c.lat}, ${c.lng}], {
      radius: ${radius}, color: '${color}',
      fillColor: '${color}', fillOpacity: 0.75, weight: 2
    }).bindTooltip('<b>${cityName} (${c.country_code})</b>${regionLine}<br/>Medián: €${(c.median_eur||0).toLocaleString('hu-HU')}<br/>${c.listings} hirdetés', {permanent: false}).addTo(map);`;
  }).join('\n');

  const legendBg = isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)';
  const legendColor = isDark ? '#ccc' : '#333';

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
    <style>html,body,#map{margin:0;padding:0;height:100%;width:100%}
    .legend{background:${legendBg};color:${legendColor};padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.8;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
    </style>
  </head><body>
    <div id="map"></div>
    <script>
      var map = L.map('map').setView([${center[0]}, ${center[1]}], ${center[2]});
      L.tileLayer('${tileUrl}',{
        attribution:'${tileAttr}',maxZoom:17
      }).addTo(map);
      ${markers}
      var legend = L.control({position:'bottomleft'});
      legend.onAdd = function(){
        var d = L.DomUtil.create('div','legend');
        d.innerHTML = '<span style="color:#22c55e">●</span> &lt;15K€ &nbsp;' +
          '<span style="color:#3b82f6">●</span> 15-25K€ &nbsp;' +
          '<span style="color:#f59e0b">●</span> 25-40K€ &nbsp;' +
          '<span style="color:#ef4444">●</span> &gt;40K€<br/>' +
          '<span style="opacity:0.6">○ kör mérete = hirdetések száma</span>';
        return d;
      };
      legend.addTo(map);
    <\/script>
  </body></html>`;
}

interface Props {
  brand: string;
  model: string;
  year?: number;
}

export default function RegionalPriceMap({ brand, model, year }: Props) {
  const [data, setData] = useState<RegionalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!brand || !model) return;
    setLoading(true);
    setError(false);
    const url = `https://api.evdiag.hu/market/as24/regional?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}${year ? `&year=${year}` : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [brand, model, year]);

  const mapHtml = useMemo(() => {
    if (!data?.top_cities?.length) return '';
    return buildMapHtml(data.top_cities, selectedCountry, isDark);
  }, [data, selectedCountry, isDark]);

  const handleCountryClick = (code: string) => {
    setSelectedCountry(prev => prev === code ? null : code);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
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
  const hasCities = data.top_cities?.some(c => c.lat != null && c.lng != null);

  return (
    <div className="space-y-4">
      {/* Country cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {countries.map((c) => {
          const isTop = c.country_code === topCode;
          const isSelected = c.country_code === selectedCountry;
          const barLeft = ((c.min_eur - globalMin) / range) * 100;
          const barWidth = ((c.max_eur - c.min_eur) / range) * 100;
          const medianPos = ((c.median_eur - globalMin) / range) * 100;

          return (
            <Card
              key={c.country_code}
              onClick={() => handleCountryClick(c.country_code)}
              className={`relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' :
                isTop ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              {isTop && !isSelected && (
                <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5">
                  Legtöbb adat
                </Badge>
              )}
              {isSelected && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5">
                  Szűrve
                </Badge>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{FLAG[c.country_code] || '🏳️'}</span>
                  <span className="text-sm font-semibold text-foreground">{c.country_name}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{fmt(c.median_eur)}</div>
                <div className="text-xs text-muted-foreground">{c.listings} hirdetés</div>
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

      {/* Map iframe */}
      {hasCities && mapHtml && (
        <div className="relative">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Piaci térkép
          </div>
          <iframe
            key={`${selectedCountry || 'all'}-${isDark ? 'dark' : 'light'}`}
            srcDoc={mapHtml}
            className="w-full border border-border"
            style={{ height: 500, borderRadius: 12, boxShadow: '0 4px 16px hsl(224 71% 40% / 0.08)' }}
            sandbox="allow-scripts"
            title="EU piaci térkép"
          />
        </div>
      )}

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

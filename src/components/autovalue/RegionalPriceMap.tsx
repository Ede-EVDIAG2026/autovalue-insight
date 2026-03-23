import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

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
  lat?: number;
  lng?: number;
  region?: string;
}

interface RegionalResponse {
  by_country: CountryData[];
  by_region: RegionData[];
  top_cities: CityData[];
}

interface ListingItem {
  url: string;
  price_eur: number;
  mileage_km: number;
  city: string;
  first_reg: string;
  variant: string;
  seller_name: string;
  seller_type: string;
  color: string;
  lat: number;
  lng: number;
  google_url: string;
}

interface ListingsMapResponse {
  count: number;
  listings: ListingItem[];
}

const fmt = (v: number) => `€${v.toLocaleString('hu-HU')}`;

function buildListingsMapHtml(listings: ListingItem[], country: string, isDark: boolean): string {
  const pts = listings.filter(l => l.lat && l.lng);

  const countryCenter: Record<string, [number, number, number]> = {
    DE: [51.1657, 10.4515, 6], NL: [52.1326, 5.2913, 7],
    BE: [50.5039, 4.4699, 7], FR: [46.2276, 2.2137, 6],
    IT: [41.8719, 12.5674, 6], ES: [40.4637, -3.7492, 6],
    AT: [47.5162, 14.5501, 7], CH: [46.8182, 8.2275, 7],
    PL: [51.9194, 19.1451, 6], CZ: [49.8175, 15.473, 7],
    HU: [47.1625, 19.5033, 7], SE: [60.1282, 18.6435, 5],
    DK: [56.2639, 9.5018, 7], NO: [60.472, 8.4689, 5],
    FI: [61.9241, 25.7482, 5], PT: [39.3999, -8.2245, 6],
    RO: [45.9432, 24.9668, 6], GB: [55.3781, -3.436, 6],
    LU: [49.8153, 6.1296, 9], SK: [48.669, 19.699, 7],
    HR: [45.1, 15.2, 7], SI: [46.1512, 14.9955, 8],
    BG: [42.7339, 25.4858, 7], IE: [53.1424, -7.6921, 7],
    GR: [39.0742, 21.8243, 6],
  };

  const c = countryCenter[country] || [51.5, 10.0, 5];
  const totalCount = pts.length;
  const radius = totalCount > 30 ? 10 : totalCount > 15 ? 14 : 20;

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
  const tileAttr = isDark ? '© CartoDB © OpenStreetMap' : '© OpenTopoMap';

  const esc = (s: string) => (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

  const markers = pts.map(p => {
    const col = (p.price_eur || 0) < 15000 ? '#16a34a' :
                (p.price_eur || 0) < 25000 ? '#2563eb' :
                (p.price_eur || 0) < 40000 ? '#d97706' : '#dc2626';
    const title = esc(p.variant || 'N/A');
    const city = esc(p.city || '');
    const seller = esc(p.seller_name || '');
    const sellerType = esc(p.seller_type || '');
    const url = esc(p.url || '');
    const googleUrl = esc(p.google_url || '');
    const firstReg = esc(p.first_reg || '');
    const price = (p.price_eur || 0).toLocaleString('hu-HU');
    const km = (p.mileage_km || 0).toLocaleString('hu-HU');

    const popupHtml = `<div style="min-width:220px;font-family:system-ui,sans-serif">` +
      `<div style="font-weight:700;font-size:14px;margin-bottom:4px">${title}</div>` +
      `<div style="font-size:20px;font-weight:800;color:${col};margin-bottom:6px">€${price}</div>` +
      `<div style="font-size:12px;color:#666;line-height:1.6">` +
      `📍 ${city}<br/>` +
      `🛣️ ${km} km<br/>` +
      `📅 ${firstReg}<br/>` +
      `🏪 ${seller} (${sellerType})` +
      `</div>` +
      `<div style="display:flex;gap:6px;margin-top:8px">` +
      `<button onclick="window.open('${url}','_blank')" style="flex:1;padding:6px 10px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">AS24 hirdetés →</button>` +
      `<button onclick="window.open('${googleUrl}','_blank')" style="flex:1;padding:6px 10px;background:#6b7280;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">Google keresés →</button>` +
      `</div></div>`;

    return `L.circleMarker([${p.lat},${p.lng}],{radius:${radius},color:'#ffffff',fillColor:'${col}',fillOpacity:0.9,weight:3})` +
      `.bindTooltip('${city}',{permanent:true,direction:'top',className:'city-label',offset:[0,-${radius}]})` +
      `.bindPopup('${popupHtml.replace(/'/g, "\\'")}',{maxWidth:280})` +
      `.addTo(map);`;
  }).join('\n');

  const legendBg = isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)';
  const legendColor = isDark ? '#ccc' : '#333';

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
    <style>
    html,body,#map{margin:0;padding:0;height:100%;width:100%}
    .city-label{background:rgba(0,0,0,0.65);color:white;border:none;border-radius:4px;font-size:10px;padding:2px 5px;white-space:nowrap;box-shadow:none}
    .city-label::before{display:none}
    .legend{background:${legendBg};color:${legendColor};padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.8;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
    </style>
  </head><body>
    <div id="map"></div>
    <script>
      var map=L.map('map').setView([${c[0]},${c[1]}],${c[2]});
      L.tileLayer('${tileUrl}',{attribution:'${tileAttr}',maxZoom:17}).addTo(map);
      ${markers}
      var legend=L.control({position:'bottomleft'});
      legend.onAdd=function(){
        var d=L.DomUtil.create('div','legend');
        d.innerHTML='<span style="color:#16a34a">●</span> &lt;15K€ &nbsp;'+
          '<span style="color:#2563eb">●</span> 15-25K€ &nbsp;'+
          '<span style="color:#d97706">●</span> 25-40K€ &nbsp;'+
          '<span style="color:#dc2626">●</span> &gt;40K€<br/>'+
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
  const [listingsData, setListingsData] = useState<ListingsMapResponse | null>(null);
  const [listingsLoading, setListingsLoading] = useState(false);

  const isDark = document.documentElement.classList.contains('dark');

  // Fetch regional summary
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

  // Fetch listings-map when country selected
  useEffect(() => {
    if (!selectedCountry || !brand || !model) {
      setListingsData(null);
      return;
    }
    setListingsLoading(true);
    const url = `https://api.evdiag.hu/market/as24/listings-map?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&country=${encodeURIComponent(selectedCountry)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setListingsData(d); setListingsLoading(false); })
      .catch(() => { setListingsData({ count: 0, listings: [] }); setListingsLoading(false); });
  }, [selectedCountry, brand, model]);

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

      {/* Listings map — only when a country is selected */}
      {selectedCountry && (
        <div style={{ marginTop: '20px' }}>
          {listingsLoading && (
            <Skeleton className="w-full rounded-xl" style={{ height: '480px' }} />
          )}
          {!listingsLoading && listingsData && listingsData.count === 0 && (
            <div className="text-center py-8 border rounded-xl bg-card">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm font-semibold text-muted-foreground">Ehhez az országhoz nincs részletes hirdetési adat</div>
            </div>
          )}
          {!listingsLoading && listingsData && listingsData.count > 0 && (
            <iframe
              key={`${selectedCountry}-${isDark}`}
              srcDoc={buildListingsMapHtml(listingsData.listings, selectedCountry, isDark)}
              style={{ width: '100%', height: '480px', border: 'none', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
              sandbox="allow-scripts allow-popups"
            />
          )}
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

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

function buildMapHtml(listings: ListingItem[], country: string): string {
  const centers: Record<string, [number, number, number]> = {
    DE:[51.16,10.45,6],NL:[52.13,5.29,7],BE:[50.50,4.47,7],
    FR:[46.22,2.21,6],IT:[41.87,12.56,6],ES:[40.46,-3.74,6],
    AT:[47.51,14.55,7],CH:[46.81,8.22,7],PL:[51.91,19.14,6],
    CZ:[49.81,15.47,7],HU:[47.16,19.50,7],SE:[60.12,18.64,5],
    DK:[56.26,9.50,7],NO:[60.47,8.46,5],FI:[61.92,25.74,5],
    PT:[39.39,-8.22,6],RO:[45.94,24.96,6],GB:[55.37,-3.43,6],
    LU:[49.81,6.12,9],SK:[48.66,19.69,7],HR:[45.1,15.2,7],
    SI:[46.15,14.99,8],BG:[42.73,25.48,7],IE:[53.14,-7.69,7],
    GR:[39.07,21.82,6],
  };
  const c = centers[country] || [51.5, 10.0, 5];

  const esc = (s: string) => (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/`/g, "'");

  const markers = listings.filter(p => p.lat && p.lng).map(p => {
    const price = p.price_eur || 0;
    const col = price < 15000 ? '#16a34a' : price < 25000 ? '#2563eb' : price < 40000 ? '#d97706' : '#dc2626';
    const km = p.mileage_km ? `${p.mileage_km.toLocaleString('hu-HU')} km` : '–';
    const year = p.first_reg ? p.first_reg.substring(0, 7) : '–';
    const variant = esc(p.variant || 'N/A');
    const city = esc(p.city || '');
    const seller = esc(p.seller_name || '');
    const sellerType = esc(p.seller_type || '');
    const url = esc(p.url || '');
    const googleUrl = esc(p.google_url || '');
    const priceStr = price.toLocaleString('hu-HU');

    const sellerHtml = seller ? `<div style="font-size:11px;color:#666;margin-top:2px">🏪 ${seller} (${sellerType})</div>` : '';
    const cityHtml = city ? `<div style="font-size:11px;color:#666;margin-top:2px">📍 ${city}</div>` : '';
    const as24Btn = url ? `<a href="${url}" target="_blank" style="flex:1;padding:6px 10px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;display:block">AS24 hirdetés →</a>` : '';
    const gBtn = googleUrl ? `<a href="${googleUrl}" target="_blank" style="flex:1;padding:6px 10px;background:#6b7280;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;display:block">Google →</a>` : '';

    const popup = `<div style="min-width:220px;font-family:system-ui,sans-serif">` +
      `<div style="font-size:22px;font-weight:800;color:${col};margin-bottom:4px">€${priceStr}</div>` +
      `<div style="font-weight:700;font-size:13px;margin-bottom:6px">${variant}</div>` +
      `<div style="font-size:11px;color:#666">📅 ${year} &nbsp; 🛣 ${km}</div>` +
      `${cityHtml}${sellerHtml}` +
      `<div style="display:flex;gap:6px;margin-top:8px">${as24Btn}${gBtn}</div>` +
      `</div>`;

    return `L.circleMarker([${p.lat},${p.lng}],{radius:10,color:'#ffffff',weight:3,fillColor:'${col}',fillOpacity:0.92}).bindPopup('${popup.replace(/'/g, "\\'")}',{maxWidth:260}).addTo(map);`;
  }).join('\n');

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
html,body,#map{margin:0;padding:0;height:100%;width:100%;font-family:sans-serif}
.leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.leaflet-popup-tip{display:none}
.legend{background:white;padding:8px 12px;border-radius:8px;font-size:11px;line-height:2;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
<\/style>
<\/head><body>
<div id="map"><\/div>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([${c[0]},${c[1]}],${c[2]});
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
  maxZoom:19,attribution:'© OpenStreetMap © CARTO'
}).addTo(map);
L.control.attribution({position:'bottomright'}).addTo(map);
${markers}
var legend=L.control({position:'bottomleft'});
legend.onAdd=function(){
  var d=L.DomUtil.create('div','legend');
  d.innerHTML='<b style="font-size:11px;color:#374151">Ár sáv</b><br>'+
    '<span style="color:#16a34a">●<\/span> &lt;15K€<br>'+
    '<span style="color:#2563eb">●<\/span> 15–25K€<br>'+
    '<span style="color:#d97706">●<\/span> 25–40K€<br>'+
    '<span style="color:#dc2626">●<\/span> &gt;40K€';
  return d;
};
legend.addTo(map);
<\/script>
<\/body><\/html>`;
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
              srcDoc={buildMapHtml(listingsData.listings, selectedCountry)}
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

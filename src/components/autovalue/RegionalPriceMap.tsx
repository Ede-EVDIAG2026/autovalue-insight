import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const FLAG: Record<string, string> = {
  DE: '🇩🇪', NL: '🇳🇱', BE: '🇧🇪', FR: '🇫🇷', IT: '🇮🇹',
  ES: '🇪🇸', AT: '🇦🇹', CH: '🇨🇭', PL: '🇵🇱', CZ: '🇨🇿',
  HU: '🇭🇺', SE: '🇸🇪', DK: '🇩🇰', NO: '🇳🇴', FI: '🇫🇮',
  PT: '🇵🇹', RO: '🇷🇴', LU: '🇱🇺', SK: '🇸🇰', HR: '🇭🇷',
  SI: '🇸🇮', BG: '🇧🇬', IE: '🇮🇪', GR: '🇬🇷', GB: '🇬🇧',
  LT: '🇱🇹', LV: '🇱🇻', EE: '🇪🇪',
};

const COUNTRY_NAME: Record<string, string> = {
  DE: 'Deutschland', NL: 'Nederland', BE: 'België', FR: 'France', IT: 'Italia',
  ES: 'España', AT: 'Österreich', CH: 'Schweiz', PL: 'Polska', CZ: 'Česko',
  HU: 'Magyarország', SE: 'Sverige', DK: 'Danmark', NO: 'Norge', FI: 'Suomi',
  PT: 'Portugal', RO: 'România', LU: 'Luxembourg', SK: 'Slovensko', HR: 'Hrvatska',
  SI: 'Slovenija', BG: 'България', IE: 'Ireland', GR: 'Ελλάδα', GB: 'United Kingdom',
  LT: 'Lietuva', LV: 'Latvija', EE: 'Eesti',
};

/* ── Types ── */
interface CountryData {
  country: string;
  listing_count: number;
  avg_price_eur: number;
  median_price_eur: number;
  min_price_eur: number;
  max_price_eur: number;
  avg_mileage_km: number;
}

interface RegionalResponse {
  found: boolean;
  total_listings: number;
  countries: CountryData[];
}

interface MapListing {
  guid: string;
  url: string;
  city: string;
  country: string;
  variant: string;
  year: string;
  price_eur: number;
  mileage_km: number;
  seller_type: string;
  seller_name: string;
  lat: number;
  lon: number;
}

interface MapResponse {
  found: boolean;
  count: number;
  listings: MapListing[];
}

const fmt = (v: number) => `€${v.toLocaleString('hu-HU')}`;

/* ── Map HTML builder ── */
function buildMapHtml(listings: MapListing[]): string {
  const esc = (s: string) => (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/`/g, "'");

  const markers = listings.filter(p => p.lat && p.lon).map(p => {
    const price = p.price_eur || 0;
    const col = price < 15000 ? '#16a34a' : price < 25000 ? '#2563eb' : price < 40000 ? '#d97706' : '#dc2626';
    const km = p.mileage_km ? `${p.mileage_km.toLocaleString('hu-HU')} km` : '–';
    const year = esc(p.year || '–');
    const variant = esc(p.variant || 'N/A');
    const city = esc(p.city || '');
    const seller = esc(p.seller_name || '');
    const sellerType = esc(p.seller_type || '');
    const url = esc(p.url || '');
    const priceStr = price.toLocaleString('hu-HU');

    const sellerHtml = seller ? `<div style="font-size:11px;color:#666;margin-top:2px">🏪 ${seller} (${sellerType})</div>` : '';
    const cityHtml = city ? `<div style="font-size:11px;color:#666;margin-top:2px">📍 ${city}</div>` : '';
    const as24Btn = url ? `<a href="${url}" target="_blank" style="display:block;padding:6px 10px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;margin-top:8px">AS24 hirdetés →</a>` : '';

    const popup = `<div style="min-width:220px;font-family:system-ui,sans-serif">` +
      `<div style="font-size:22px;font-weight:800;color:${col};margin-bottom:4px">€${priceStr}</div>` +
      `<div style="font-weight:700;font-size:13px;margin-bottom:6px">${variant}</div>` +
      `<div style="font-size:11px;color:#666">📅 ${year} &nbsp; 🚗 ${km}</div>` +
      `${cityHtml}${sellerHtml}` +
      `${as24Btn}` +
      `</div>`;

    return `L.circleMarker([${p.lat},${p.lon}],{radius:10,color:'#ffffff',weight:3,fillColor:'${col}',fillOpacity:0.92}).bindPopup('${popup.replace(/'/g, "\\'")}',{maxWidth:260}).addTo(clusters);`;
  }).join('\n');

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"><\/script>
<style>
html,body,#map{margin:0;padding:0;height:100%;width:100%;font-family:sans-serif}
.leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.leaflet-popup-tip{display:none}
.legend{background:white;padding:8px 12px;border-radius:8px;font-size:11px;line-height:2;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
.marker-cluster-small{background-color:rgba(37,99,235,0.25)}
.marker-cluster-small div{background-color:rgba(37,99,235,0.7);color:#fff;font-weight:700}
.marker-cluster-medium{background-color:rgba(217,119,6,0.25)}
.marker-cluster-medium div{background-color:rgba(217,119,6,0.7);color:#fff;font-weight:700}
.marker-cluster-large{background-color:rgba(220,38,38,0.25)}
.marker-cluster-large div{background-color:rgba(220,38,38,0.7);color:#fff;font-weight:700}
<\/style>
<\/head><body>
<div id="map"><\/div>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([50.5,10.0],5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
  maxZoom:18,attribution:'© OpenStreetMap © CARTO'
}).addTo(map);
L.control.attribution({position:'bottomright'}).addTo(map);
var clusters=L.markerClusterGroup({maxClusterRadius:50,spiderfyOnMaxZoom:true,showCoverageOnHover:false});
${markers}
map.addLayer(clusters);
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

/* ── Component ── */
interface Props {
  brand: string;
  model: string;
  year?: number;
}

export default function RegionalPriceMap({ brand, model }: Props) {
  const [data, setData] = useState<RegionalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  // Fetch regional summary (no year filter — all records)
  useEffect(() => {
    if (!brand || !model) return;
    setLoading(true);
    setError(false);
    const url = `https://api.evdiag.hu/market/as24/regional?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [brand, model]);

  // Fetch map listings
  useEffect(() => {
    if (!brand || !model) return;
    setMapLoading(true);
    const url = `https://api.evdiag.hu/market/as24/map?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&limit=300`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setMapData(d); setMapLoading(false); })
      .catch(() => { setMapData({ found: false, count: 0, listings: [] }); setMapLoading(false); });
  }, [brand, model]);

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

  if (error || !data || !data.found || !data.countries?.length) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">🌍</div>
        <div className="text-sm font-semibold text-muted-foreground">Nincs elegendő regionális adat</div>
        <div className="text-xs text-muted-foreground/70 mt-1">Ehhez a járműhöz jelenleg nem áll rendelkezésre regionális piaci adat.</div>
      </div>
    );
  }

  const countries = [...data.countries].sort((a, b) => b.listing_count - a.listing_count);
  const topCode = countries[0]?.country;
  const globalMax = Math.max(...countries.map(c => c.max_price_eur));
  const globalMin = Math.min(...countries.map(c => c.min_price_eur));
  const range = globalMax - globalMin || 1;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-semibold text-foreground">
          Összesen: {data.total_listings} hirdetés, {data.countries.length} ország
        </div>
      </div>

      {/* Country cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {countries.map((c) => {
          const isTop = c.country === topCode;
          const isSelected = c.country === selectedCountry;
          const barLeft = ((c.min_price_eur - globalMin) / range) * 100;
          const barWidth = ((c.max_price_eur - c.min_price_eur) / range) * 100;
          const medianPos = ((c.median_price_eur - globalMin) / range) * 100;

          return (
            <Card
              key={c.country}
              onClick={() => handleCountryClick(c.country)}
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
                  <span className="text-lg">{FLAG[c.country] || '🏳️'}</span>
                  <span className="text-sm font-semibold text-foreground">{COUNTRY_NAME[c.country] || c.country}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{fmt(c.median_price_eur)}</div>
                <div className="text-xs text-muted-foreground">{c.listing_count} hirdetés</div>
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
                  <span>{fmt(c.min_price_eur)}</span>
                  <span>{fmt(c.max_price_eur)}</span>
                </div>
                {c.avg_mileage_km > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    Ø {Math.round(c.avg_mileage_km / 1000)}k km
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EU Map */}
      <div style={{ marginTop: '20px' }}>
        {mapLoading && (
          <Skeleton className="w-full rounded-xl" style={{ height: '520px' }} />
        )}
        {!mapLoading && (!mapData || mapData.count === 0) && (
          <div className="text-center py-8 border rounded-xl bg-card">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-sm font-semibold text-muted-foreground">Részletes hirdetési térkép hamarosan</div>
          </div>
        )}
        {!mapLoading && mapData && mapData.count > 0 && (
          <iframe
            key={`map-${brand}-${model}`}
            srcDoc={buildMapHtml(mapData.listings)}
            style={{ width: '100%', height: '520px', border: 'none', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
            sandbox="allow-scripts allow-popups"
          />
        )}
      </div>
    </div>
  );
}

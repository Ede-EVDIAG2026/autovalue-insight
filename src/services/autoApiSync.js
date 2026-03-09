import { computeValuation, generateMockFallback } from './priceAggregator';

const AUTO_API_BASE = import.meta?.env?.VITE_AUTO_API_BASE ?? '';
const AUTO_API_KEY = import.meta?.env?.VITE_AUTO_API_KEY ?? '';
const CARAPIS_KEY = import.meta?.env?.VITE_CARAPIS_API_KEY ?? '';
const API_BASE = import.meta?.env?.VITE_API_BASE ?? '';

const _cache = new Map();

function cacheGet(key) {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) { _cache.delete(key); return null; }
  return e.value;
}

function cacheSet(key, value, ttl = 14400) {
  _cache.set(key, { value, expires: Date.now() + ttl * 1000 });
}

async function fetchFromBackend(form) {
  if (!API_BASE) return null;
  try {
    const r = await fetch(`${API_BASE}/api/v1/valuation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchCarapisListings({ brand, model, year, fuel, country }) {
  if (!CARAPIS_KEY) return [];
  const fuelMap = { 'Elektromos (BEV)': 'electric', 'Plug-in Hibrid (PHEV)': 'hybrid', 'Hibrid (HEV)': 'hybrid', 'Benzin': 'petrol', 'Dízel': 'diesel' };
  try {
    const r = await fetch('https://api.carapis.com/v1/parsers/autoscout24/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CARAPIS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${brand} ${model} ${year}`, country, year_from: parseInt(year) - 1, year_to: parseInt(year) + 1, fuel_type: fuelMap[fuel] ?? 'petrol', limit: 200 }),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.data?.listings ?? []).map(l => ({ inner_id: l.id, make: l.vehicle?.make ?? brand, model: l.vehicle?.model ?? model, year: l.specifications?.year, engine_type: l.specifications?.fuel_type, km_age: l.specifications?.mileage, price_eur: l.price?.amount, country: l.location?.country_code ?? country, section: 'Used' }));
  } catch { return []; }
}

async function fetchBulkListings() {
  if (!AUTO_API_BASE || !AUTO_API_KEY) return [];
  try {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`${AUTO_API_BASE}/${today}/all_active.json`, { headers: { Authorization: `Basic ${AUTO_API_KEY}` } });
    if (!r.ok) return [];
    const text = await r.text();
    return text.trim().split('\n').map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

export async function fetchValuation(form) {
  const cacheKey = `val:${form.brand}:${form.model}:${form.year}:${form.fuel}:${Math.round(form.km / 5000) * 5000}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const backend = await fetchFromBackend(form);
  if (backend) { cacheSet(cacheKey, backend); return backend; }

  let listings = await fetchBulkListings();
  if (listings.length < 50) {
    const rt = await fetchCarapisListings(form);
    listings = [...listings, ...rt];
  }

  if (listings.length > 0) {
    try {
      const result = computeValuation(form, listings);
      cacheSet(cacheKey, result);
      return result;
    } catch (e) {
      if (!e.message.startsWith('INSUFFICIENT_DATA')) throw e;
    }
  }

  const mock = generateMockFallback(form);
  cacheSet(cacheKey, mock, 1800);
  return mock;
}
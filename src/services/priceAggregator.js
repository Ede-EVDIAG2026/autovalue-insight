const FUEL_MAP = {
  'Elektromos (BEV)': ['Electric','EV','BEV','electric','e'],
  'Plug-in Hibrid (PHEV)': ['Plug-in Hybrid','PHEV','Plugin','phev'],
  'Hibrid (HEV)': ['Hybrid','HEV','Mild Hybrid','hybrid'],
  'Benzin': ['Petrol','Gasoline','petrol','b','gasoline'],
  'Dízel': ['Diesel','diesel','d'],
};

export function filterListings(listings, { brand, model, year, fuel, km }) {
  const fuelVariants = FUEL_MAP[fuel] || [fuel];
  const yearInt = parseInt(year);
  const kmInt = parseInt(km);
  return listings.filter(l => {
    const makeOk = l.make?.toLowerCase().includes(brand.toLowerCase());
    const modelOk = l.model?.toLowerCase().includes(model.split(' ')[0].toLowerCase());
    const yearOk = Math.abs((l.year ?? 0) - yearInt) <= 2;
    const fuelOk = fuelVariants.some(f => (l.engine_type ?? '').toLowerCase().includes(f.toLowerCase()));
    const kmOk = l.km_age ? l.km_age >= kmInt * 0.55 && l.km_age <= kmInt * 1.45 : true;
    const priceOk = l.price_eur > 500 && l.price_eur < 500000;
    return makeOk && modelOk && yearOk && fuelOk && kmOk && priceOk && l.section !== 'New';
  });
}

export function removeOutliers(prices) {
  if (prices.length < 4) return prices;
  const s = [...prices].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  const iqr = q3 - q1;
  return s.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

export function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

export function kmDepreciationCorrection(listings, targetKm) {
  const pts = listings.filter(l => l.price_eur && l.km_age > 0).map(l => ({ x: l.km_age, y: l.price_eur }));
  if (pts.length < 10) return 0;
  const n = pts.length;
  const xm = pts.reduce((s, p) => s + p.x, 0) / n;
  const ym = pts.reduce((s, p) => s + p.y, 0) / n;
  const num = pts.reduce((s, p) => s + (p.x - xm) * (p.y - ym), 0);
  const den = pts.reduce((s, p) => s + (p.x - xm) ** 2, 0);
  if (den === 0) return 0;
  return Math.round((num / den) * (targetKm - xm));
}

export function computeVelocity(listings) {
  const withDuration = listings.filter(l => l.created_at && l.removed_at);
  if (withDuration.length < 5) {
    const d = listings.length;
    return { medianDays: d > 200 ? 18 : d > 100 ? 25 : d > 50 ? 35 : 45, prob30days: d > 200 ? 82 : d > 100 ? 72 : d > 50 ? 62 : 52 };
  }
  const durations = withDuration.map(l => (new Date(l.removed_at) - new Date(l.created_at)) / 86400000).filter(d => d > 0 && d < 365).sort((a, b) => a - b);
  return { medianDays: Math.round(durations[Math.floor(durations.length / 2)]), prob30days: Math.round((durations.filter(d => d <= 30).length / durations.length) * 100) };
}

export function computeRegional(listings) {
  return ['HU','DE','AT','FR','IT','ES','PL','CZ','SK','RO','NL','BE'].map(code => {
    const cl = listings.filter(l => l.country === code);
    if (cl.length < 3) return null;
    const prices = removeOutliers(cl.map(l => l.price_eur).filter(Boolean));
    const sorted = [...prices].sort((a, b) => a - b);
    return { code, price: percentile(sorted, 50), velocity: computeVelocity(cl).prob30days };
  }).filter(Boolean);
}

export function generateMockFallback({ year, km }) {
  const base = 18000 + (2024 - parseInt(year)) * -1400 + (Math.random() * 2000 - 1000);
  const mid = Math.max(3000, base + (parseInt(km) - 80000) * -0.04);
  return {
    p10: Math.round(mid * 0.74), p25: Math.round(mid * 0.87), p50: Math.round(mid),
    p75: Math.round(mid * 1.13), p90: Math.round(mid * 1.26),
    recommended: { low: Math.round(mid * 0.94), high: Math.round(mid * 1.09) },
    riskScore: Math.round(20 + Math.random() * 60),
    velocityDays: Math.round(18 + Math.random() * 42),
    velocityProb: Math.round(55 + Math.random() * 35),
    trendData: null, trendDates: null, regional: null,
    marketDepth: Math.round(340 + Math.random() * 280),
    similarListings: Math.round(48 + Math.random() * 90),
    demandIndex: Math.round(62 + Math.random() * 30),
    _source: 'mock',
  };
}

export function computeValuation(form, listings) {
  const filtered = filterListings(listings, form);
  if (filtered.length < 5) throw new Error('INSUFFICIENT_DATA:' + filtered.length);
  const clean = removeOutliers(filtered.map(l => l.price_eur).filter(p => p > 0));
  const sorted = [...clean].sort((a, b) => a - b);
  const corr = kmDepreciationCorrection(filtered, parseInt(form.km));
  const p = (n) => Math.max(500, Math.round(percentile(sorted, n) + corr));
  const vel = computeVelocity(filtered);
  const marketDepth = filtered.length;
  const demandIndex = Math.min(100, Math.round((marketDepth / 400) * 100));
  const spread = Math.min(40, Math.round(((p(90) - p(10)) / p(50)) * 100));
  const riskScore = Math.min(100, spread + Math.min(30, Math.round((vel.medianDays / 60) * 30)) + Math.min(30, Math.round((1 - demandIndex / 100) * 30)));
  const regional = computeRegional(filtered);
  return {
    p10: p(10), p25: p(25), p50: p(50), p75: p(75), p90: p(90),
    recommended: { low: p(40), high: p(65) },
    riskScore, velocityDays: vel.medianDays, velocityProb: vel.prob30days,
    trendData: null, trendDates: null,
    regional: regional.length >= 3 ? regional : null,
    marketDepth, similarListings: filtered.filter(l => l.km_age && Math.abs(l.km_age - parseInt(form.km)) < 25000).length,
    demandIndex, _source: 'autoscout24',
  };
}
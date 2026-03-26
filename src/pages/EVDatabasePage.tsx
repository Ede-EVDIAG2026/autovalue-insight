import { useState, useEffect, useMemo } from 'react';
import AppHeader from '@/components/AppHeader';
import EVModelCard from '@/components/market/EVModelCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';

const tx: Record<string, Record<Lang, string>> = {
  title: { HU: '⚡ EV Tudásbázis', EN: '⚡ EV Knowledge Base', DE: '⚡ EV-Wissensdatenbank' },
  subtitle_models: { HU: 'modell', EN: 'models', DE: 'Modelle' },
  subtitle_data: { HU: 'EU/CN/US adatok', EN: 'EU/CN/US data', DE: 'EU/CN/US Daten' },
  filter_search: { HU: 'Keresés', EN: 'Search', DE: 'Suche' },
  filter_search_placeholder: { HU: 'Gyártó vagy modell...', EN: 'Make or model...', DE: 'Hersteller oder Modell...' },
  filter_make: { HU: 'Gyártó', EN: 'Make', DE: 'Hersteller' },
  filter_all: { HU: 'Összes', EN: 'All', DE: 'Alle' },
  filter_region: { HU: 'Régió', EN: 'Region', DE: 'Region' },
  filter_drive_type: { HU: 'Hajtás típus', EN: 'Drive type', DE: 'Antriebsart' },
  filter_min_battery: { HU: 'Min akksi', EN: 'Min battery', DE: 'Min Batterie' },
  filter_min_range: { HU: 'Min hatótáv', EN: 'Min range', DE: 'Min Reichweite' },
  filter_all_short: { HU: 'Mind', EN: 'All', DE: 'Alle' },
  results_model: { HU: 'modell', EN: 'models', DE: 'Modelle' },
  results_filtered: { HU: '(szűrt)', EN: '(filtered)', DE: '(gefiltert)' },
  no_results: { HU: 'Nincs találat a megadott szűrőkre.', EN: 'No results for the selected filters.', DE: 'Keine Ergebnisse für die gewählten Filter.' },
  footer: { HU: 'Forrás: ev-database.org + AI · Frissítve: 2026.03', EN: 'Source: ev-database.org + AI · Updated: 2026.03', DE: 'Quelle: ev-database.org + AI · Aktualisiert: 2026.03' },
  no_detail: { HU: 'Nincs elérhető részletes adat.', EN: 'No detailed data available.', DE: 'Keine detaillierten Daten verfügbar.' },
  spec_battery: { HU: '🔋 Akkumulátor', EN: '🔋 Battery', DE: '🔋 Batterie' },
  spec_wltp: { HU: '📍 WLTP hatótáv', EN: '📍 WLTP range', DE: '📍 WLTP-Reichweite' },
  spec_real_range: { HU: '🛣 Reális hatótáv', EN: '🛣 Real range', DE: '🛣 Reale Reichweite' },
  spec_warranty: { HU: '🛡 Garancia', EN: '🛡 Warranty', DE: '🛡 Garantie' },
  spec_connector: { HU: '🔌 Csatlakozó', EN: '🔌 Connector', DE: '🔌 Anschluss' },
  spec_ota: { HU: '📡 OTA', EN: '📡 OTA', DE: '📡 OTA' },
  spec_adas: { HU: '🤖 ADAS', EN: '🤖 ADAS', DE: '🤖 ADAS' },
  degradation: { HU: 'Degradáció:', EN: 'Degradation:', DE: 'Degradation:' },
  rental_battery_warn: { HU: '⚠ Bérletes akksi opció létezett ehhez a modellhez!', EN: '⚠ Rental battery option existed for this model!', DE: '⚠ Mietbatterie-Option existierte für dieses Modell!' },
  fault_codes_title: { HU: 'Ismert hibakódok', EN: 'Known fault codes', DE: 'Bekannte Fehlercodes' },
  th_dtc: { HU: 'DTC', EN: 'DTC', DE: 'DTC' },
  th_severity: { HU: 'Súlyosság', EN: 'Severity', DE: 'Schweregrad' },
  th_component: { HU: 'Komponens', EN: 'Component', DE: 'Komponente' },
  th_fix: { HU: 'Javítás', EN: 'Fix', DE: 'Reparatur' },
  data_quality: { HU: 'Adatminőség', EN: 'Data quality', DE: 'Datenqualität' },
  warranty_format: { HU: 'év', EN: 'yr', DE: 'J.' },
  details: { HU: 'Részletek', EN: 'Details', DE: 'Details' },
};

interface EVModel {
  make: string;
  model: string;
  variant: string;
  battery_kwh: number;
  range_km_wltp: number;
  fast_charge_kw: number;
  cell_chemistry: string;
  data_confidence: number;
  model_type?: string;
}

interface EVModelDetail {
  battery_kwh: number;
  range_km_wltp: number;
  real_range_80pct_km: number;
  warranty_battery_years: number;
  warranty_battery_km: number;
  connector_type: string;
  ota_updates: string;
  adas_level: string;
  degradation_risk: string;
  rental_battery: boolean;
  fault_codes: { dtc_code: string; severity: string; component: string; known_fix?: string; dtc_description?: string }[];
  data_confidence: number;
  [key: string]: any;
}

interface Filters {
  make: string;
  region: string;
  minBattery: number;
  minRange: number;
  search: string;
  model_type: string;
}

const modelTypes = ['BEV', 'PHEV', 'HEV', 'MHEV'] as const;
const modelTypeIcons: Record<string, string> = { BEV: '⚡', PHEV: '🔌', HEV: '♻️', MHEV: '〰️' };

const regions = ['EU', 'CN', 'US'];
const batteryOptions = [0, 40, 60, 80];
const rangeOptions = [0, 200, 300, 400];

const degradationColor: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
};

const severityColor: Record<string, string> = {
  HIGH: 'text-red-600',
  CRITICAL: 'text-red-700 font-bold',
  MEDIUM: 'text-orange-600',
  LOW: 'text-muted-foreground',
};

export default function EVDatabasePage() {
  const { lang } = useLanguage();
  const l = (key: string) => tx[key]?.[lang] ?? tx[key]?.HU ?? key;

  const [models, setModels] = useState<EVModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ make: '', region: 'EU', minBattery: 0, minRange: 0, search: '', model_type: '' });
  const [selectedModel, setSelectedModel] = useState<{ make: string; model: string } | null>(null);
  const [detail, setDetail] = useState<EVModelDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch models on region change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.evdiag.hu/api/v1/ev-kb/models?region=${filters.region}&limit=200`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (!cancelled) setModels(Array.isArray(d) ? d : d.models || []); })
      .catch(() => { if (!cancelled) setModels([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters.region]);

  // Unique makes
  const makes = useMemo(() => {
    const set = new Set(models.map(m => m.make));
    return Array.from(set).sort();
  }, [models]);

  // Filtered list
  const filtered = useMemo(() => {
    return models.filter(m => {
      if (filters.make && m.make !== filters.make) return false;
      if (filters.minBattery && m.battery_kwh < filters.minBattery) return false;
      if (filters.minRange && m.range_km_wltp < filters.minRange) return false;
      if (filters.model_type && m.model_type !== filters.model_type) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!`${m.make} ${m.model}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [models, filters]);

  // Fetch detail
  useEffect(() => {
    if (!selectedModel) { setDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    fetch(`https://api.evdiag.hu/api/v1/ev-kb/model/${encodeURIComponent(selectedModel.make)}/${encodeURIComponent(selectedModel.model)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedModel]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">{l('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? '…' : `${models.length} ${l('subtitle_models')}`} · BEV + PHEV + HEV + MHEV · {l('subtitle_data')}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs text-muted-foreground mb-1 block">{l('filter_search')}</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={l('filter_search_placeholder')}
                    className="pl-9 h-9"
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
              </div>

              {/* Make */}
              <div className="min-w-[140px]">
                <label className="text-xs text-muted-foreground mb-1 block">{l('filter_make')}</label>
                <Select value={filters.make || 'all'} onValueChange={v => setFilters(f => ({ ...f, make: v === 'all' ? '' : v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{l('filter_all')}</SelectItem>
                    {makes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Region toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('filter_region')}</label>
                <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                  {regions.map(r => (
                    <button
                      key={r}
                      onClick={() => setFilters(f => ({ ...f, region: r }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        filters.region === r
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model type toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('filter_drive_type')}</label>
                <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => setFilters(f => ({ ...f, model_type: '' }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      !filters.model_type
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l('filter_all')}
                  </button>
                  {modelTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setFilters(f => ({ ...f, model_type: t }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        filters.model_type === t
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {modelTypeIcons[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min battery */}
              <div className="min-w-[110px]">
                <label className="text-xs text-muted-foreground mb-1 block">{l('filter_min_battery')}</label>
                <Select value={String(filters.minBattery)} onValueChange={v => setFilters(f => ({ ...f, minBattery: Number(v) }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {batteryOptions.map(b => <SelectItem key={b} value={String(b)}>{b === 0 ? l('filter_all_short') : `${b}+ kWh`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Min range */}
              <div className="min-w-[110px]">
                <label className="text-xs text-muted-foreground mb-1 block">{l('filter_min_range')}</label>
                <Select value={String(filters.minRange)} onValueChange={v => setFilters(f => ({ ...f, minRange: Number(v) }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rangeOptions.map(r => <SelectItem key={r} value={String(r)}>{r === 0 ? l('filter_all_short') : `${r}+ km`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-4">
          {filtered.length} {l('results_model')}{filters.make || filters.search || filters.minBattery || filters.minRange || filters.model_type ? ` ${l('results_filtered')}` : ''}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="pt-5 pb-4 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-1.5 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {l('no_results')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m, i) => (
              <EVModelCard
                key={`${m.make}-${m.model}-${m.variant}-${i}`}
                {...m}
                onClick={() => setSelectedModel({ make: m.make, model: m.model })}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-muted-foreground">
           {l('footer')}
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedModel} onOpenChange={open => { if (!open) setSelectedModel(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedModel ? `${selectedModel.make} ${selectedModel.model}` : ''}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : !detail ? (
            <p className="text-muted-foreground py-4">{l('no_detail')}</p>
          ) : (
            <div className="space-y-4 py-2">
              {/* Specs */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <DetailRow label={l('spec_battery')} value={`${detail.battery_kwh} kWh`} />
                <DetailRow label={l('spec_wltp')} value={`${detail.range_km_wltp} km`} />
                <DetailRow label={l('spec_real_range')} value={`${detail.real_range_80pct_km} km`} />
                <DetailRow label={l('spec_warranty')} value={`${detail.warranty_battery_years} ${l('warranty_format')} / ${(detail.warranty_battery_km || 0).toLocaleString(lang === 'DE' ? 'de-DE' : lang === 'EN' ? 'en-US' : 'hu-HU')} km`} />
                <DetailRow label={l('spec_connector')} value={detail.connector_type} />
                <DetailRow label={l('spec_ota')} value={detail.ota_updates} />
                <DetailRow label={l('spec_adas')} value={detail.adas_level} />
              </div>

              {/* Degradation */}
              {detail.degradation_risk && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{l('degradation')}</span>
                  <Badge className={`text-xs border ${degradationColor[detail.degradation_risk?.toUpperCase()] || 'bg-muted text-muted-foreground'}`}>
                    {detail.degradation_risk}
                  </Badge>
                </div>
              )}

              {/* Rental battery warning */}
              {detail.rental_battery === true && (
                <Alert variant="destructive" className="py-2 px-3">
                  <AlertDescription className="text-xs font-semibold">
                    ⚠ {l('rental_battery_warn')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Fault codes table */}
              {detail.fault_codes && detail.fault_codes.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2">{l('fault_codes_title')}</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_dtc')}</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_severity')}</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_component')}</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{l('th_fix')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.fault_codes.map((fc, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 font-mono">{fc.dtc_code}</td>
                            <td className={`px-3 py-2 font-semibold ${severityColor[fc.severity?.toUpperCase()] || ''}`}>
                              {fc.severity}
                            </td>
                            <td className="px-3 py-2">{fc.component}</td>
                            <td className="px-3 py-2 text-muted-foreground">{fc.known_fix || '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{l('data_quality')}</span>
                  <span>{Math.round((detail.data_confidence ?? 0) * 100)}%</span>
                </div>
                <Progress value={Math.round((detail.data_confidence ?? 0) * 100)} className="h-1.5" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BatteryInspectionWizard from '@/components/battery/BatteryInspectionWizard';
import DegradationDetailModal from '@/components/DegradationDetailModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, X, GitCompareArrows, Microscope } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { t as globalT } from '@/i18n/translations';

const tx: Record<string, Record<Lang, string>> = {
  subtitle_models: { HU: 'modell', EN: 'models', DE: 'Modelle' },
  subtitle_data: { HU: 'EU/CN/US adatok', EN: 'EU/CN/US data', DE: 'EU/CN/US Daten' },
  filter_make: { HU: 'Gyártó', EN: 'Make', DE: 'Hersteller' },
  filter_all: { HU: 'Összes', EN: 'All', DE: 'Alle' },
  filter_region: { HU: 'Régió', EN: 'Region', DE: 'Region' },
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
  compare: { HU: 'Összehasonlítás', EN: 'Compare', DE: 'Vergleichen' },
  compare_models: { HU: 'Modellek összehasonlítása', EN: 'Compare models', DE: 'Modelle vergleichen' },
  compare_selected: { HU: 'kiválasztva', EN: 'selected', DE: 'ausgewählt' },
  compare_clear: { HU: 'Törlés', EN: 'Clear', DE: 'Löschen' },
  compare_no_data: { HU: 'n/a', EN: 'n/a', DE: 'n/v' },
  footer: { HU: 'Forrás: ev-database.org + AI · Frissítve: 2026.03', EN: 'Source: ev-database.org + AI · Updated: 2026.03', DE: 'Quelle: ev-database.org + AI · Aktualisiert: 2026.03' },
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
  ac_charge_kw?: number;
  motor_kw?: number;
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

const regions = ['EU', 'CN', 'US'];
const REGION_COUNTS: Record<string, number> = { EU: 354, CN: 50, US: 9 };

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; activeBg: string }> = {
  BEV: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', dot: '#1d4ed8', activeBg: '#1d4ed8' },
  PHEV: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', dot: '#15803d', activeBg: '#15803d' },
  HEV: { bg: '#fef3c7', text: '#d97706', border: '#fde68a', dot: '#d97706', activeBg: '#d97706' },
  MHEV: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', dot: '#7c3aed', activeBg: '#7c3aed' },
};

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

const ITEMS_PER_PAGE = 24;

export default function EVDatabasePage() {
  const { lang } = useLanguage();
  const l = (key: string) => tx[key]?.[lang] ?? tx[key]?.HU ?? key;
  const tr = (key: string) => globalT[key]?.[lang] ?? globalT[key]?.HU ?? key;
  const [searchParams, setSearchParams] = useSearchParams();

  const [models, setModels] = useState<EVModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [kbStats, setKbStats] = useState<{ models: number; specs: number } | null>(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://46.224.176.213:8890';
    fetch(`${API_BASE}/api/v1/ev-kb/health`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setKbStats({ models: d.models, specs: d.specs }); })
      .catch(() => null);
  }, []);

  const [filters, setFilters] = useState<Filters>({ make: '', region: 'EU', minBattery: 0, minRange: 0, search: '', model_type: '' });
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<{ make: string; model: string } | null>(null);
  const [detail, setDetail] = useState<EVModelDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareDetails, setCompareDetails] = useState<Record<string, EVModelDetail>>({});
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionModel, setInspectionModel] = useState<any>(null);
  const [degModalOpen, setDegModalOpen] = useState(false);
  const [savedDetail, setSavedDetail] = useState<any>(null);
  const autoOpenHandled = useRef(false);
  const autoOpenCardRef = useRef<HTMLDivElement>(null);
  const pendingAction = useRef<string | null>(null);
  const MAX_COMPARE = 3;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const compareKey = (m: EVModel) => `${m.make}::${m.model}`;

  const toggleCompare = useCallback((m: EVModel) => {
    const key = compareKey(m);
    setCompareList(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : prev.length < MAX_COMPARE ? [...prev, key] : prev
    );
  }, []);

  const openCompare = useCallback(async () => {
    setCompareOpen(true);
    setCompareLoading(true);
    const details: Record<string, EVModelDetail> = {};
    await Promise.all(
      compareList.map(async key => {
        const [make, model] = key.split('::');
        try {
          const r = await fetch(`https://api.evdiag.hu/api/v1/ev-kb/model/${encodeURIComponent(make)}/${encodeURIComponent(model)}`);
          if (r.ok) details[key] = await r.json();
        } catch {}
      })
    );
    setCompareDetails(details);
    setCompareLoading(false);
  }, [compareList]);

  // Fetch models on region change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.evdiag.hu/api/v1/ev-kb/models?region=${filters.region}&limit=500`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (!cancelled) setModels(Array.isArray(d) ? d : d.models || []); })
      .catch(() => { if (!cancelled) setModels([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters.region]);

  // Auto-open from query params
  useEffect(() => {
    if (autoOpenHandled.current) return;
    const qMake = searchParams.get('make');
    const qModel = searchParams.get('model');
    const autoopen = searchParams.get('autoopen');
    const action = searchParams.get('action');
    if (autoopen !== 'true' || !qMake || !qModel) return;

    const MAKE_ALIASES: Record<string, string[]> = {
      tesla: ['tesla', 'Tesla', 'TESLA'],
      volkswagen: ['volkswagen', 'vw', 'VW', 'Volkswagen'],
      bmw: ['bmw', 'BMW', 'Bmw'],
      mercedes: ['mercedes', 'Mercedes', 'mercedes-benz', 'Mercedes-Benz'],
      hyundai: ['hyundai', 'Hyundai', 'HYUNDAI'],
      kia: ['kia', 'Kia', 'KIA'],
      byd: ['byd', 'BYD', 'Byd'],
      volvo: ['volvo', 'Volvo', 'VOLVO'],
      polestar: ['polestar', 'Polestar'],
      renault: ['renault', 'Renault'],
      peugeot: ['peugeot', 'Peugeot'],
      audi: ['audi', 'Audi', 'AUDI'],
      ford: ['ford', 'Ford'],
      honda: ['honda', 'Honda'],
      toyota: ['toyota', 'Toyota'],
      mg: ['mg', 'MG', 'saic-mg'],
      nio: ['nio', 'NIO'],
      xpeng: ['xpeng', 'XPENG'],
    };

    const normalizeMake = (input: string): string => {
      const low = input.toLowerCase();
      for (const [, aliases] of Object.entries(MAKE_ALIASES)) {
        if (aliases.some(a => a.toLowerCase() === low)) return aliases[0];
      }
      return low;
    };

    const normalizedQMake = normalizeMake(qMake);
    const qModelLow = qModel.toLowerCase();

    const fetchAllRegions = async () => {
      const results = await Promise.all(
        regions.map(r =>
          fetch(`https://api.evdiag.hu/api/v1/ev-kb/models?region=${r}&limit=500`)
            .then(res => res.ok ? res.json() : [])
            .then(d => ({ region: r, models: Array.isArray(d) ? d : d.models || [] }))
            .catch(() => ({ region: r, models: [] as EVModel[] }))
        )
      );

      let foundRegion = '';
      let foundModel: EVModel | null = null;

      for (const { region, models: regionModels } of results) {
        if (!foundModel) {
          const exact = regionModels.find((m: EVModel) =>
            normalizeMake(m.make) === normalizedQMake &&
            m.model.toLowerCase() === qModelLow
          );
          if (exact) { foundModel = exact; foundRegion = region; }
        }
      }

      if (!foundModel) {
        for (const { region, models: regionModels } of results) {
          const partial = regionModels.find((m: EVModel) =>
            normalizeMake(m.make) === normalizedQMake &&
            m.model.toLowerCase().includes(qModelLow)
          );
          if (partial) { foundModel = partial; foundRegion = region; break; }
        }
      }

      if (!foundModel) {
        for (const { region, models: regionModels } of results) {
          const loose = regionModels.find((m: EVModel) =>
            m.make.toLowerCase().includes(normalizedQMake)
          );
          if (loose) { foundModel = loose; foundRegion = region; break; }
        }
      }

      autoOpenHandled.current = true;
      if (action) pendingAction.current = action;

      if (foundModel && foundRegion) {
        setFilters(f => ({ ...f, region: foundRegion, search: `${foundModel!.make} ${foundModel!.model}`, make: '' }));
        setSelectedModel({ make: foundModel.make, model: foundModel.model });
        setTimeout(() => {
          autoOpenCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      } else {
        setFilters(f => ({ ...f, search: `${qMake} ${qModel}`, make: '' }));
      }

      searchParams.delete('autoopen');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    };

    fetchAllRegions();
  }, [searchParams, setSearchParams]);

  // Filtered list
  const filtered = useMemo(() => {
    return models.filter(m => {
      if (filters.make && m.make !== filters.make) return false;
      if (filters.minBattery && m.battery_kwh < filters.minBattery) return false;
      if (filters.minRange && m.range_km_wltp < filters.minRange) return false;
      if (activeTypes.size > 0 && !activeTypes.has(m.model_type || 'BEV')) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!`${m.make} ${m.model}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [models, filters, activeTypes]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (filters.search.length < 2) return [];
    const q = filters.search.toLowerCase();
    return models
      .filter(m => `${m.make} ${m.model}`.toLowerCase().includes(q))
      .slice(0, 8)
      .map(m => ({ make: m.make, model: m.model, type: m.model_type || 'BEV', label: `${m.make} ${m.model}` }));
  }, [models, filters.search]);

  // Sorted by range for featured/ranked
  const sortedByRange = useMemo(() => [...filtered].sort((a, b) => (b.range_km_wltp || 0) - (a.range_km_wltp || 0)), [filtered]);
  const maxRange = useMemo(() => Math.max(...models.map(m => m.range_km_wltp || 0), 1), [models]);

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

  // Handle action param after detail loads
  useEffect(() => {
    if (!detail || !selectedModel || !pendingAction.current) return;
    const action = pendingAction.current;
    pendingAction.current = null;
    const modelType = models.find(m => m.make === selectedModel.make && m.model === selectedModel.model)?.model_type || 'BEV';
    if (action === 'degradation') {
      setDegModalOpen(true);
    } else if (action === 'inspection') {
      setInspectionModel({
        make: selectedModel.make,
        model: selectedModel.model,
        variant: '',
        battery_kwh: detail.battery_kwh,
        model_type: modelType,
        range_km_wltp: detail.range_km_wltp,
        cell_chemistry: null,
        ...detail,
      });
      setInspectionOpen(true);
    }
  }, [detail, selectedModel, models]);

  const isSearchActive = filters.search.length >= 2 || activeTypes.size > 0;

  const clearSearch = () => {
    setFilters(f => ({ ...f, search: '' }));
    setActiveTypes(new Set());
    setSearchDropdownOpen(false);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Handle ESC to clear search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (filters.search || activeTypes.size > 0)) clearSearch();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filters.search, activeTypes]);

  const featuredModel = sortedByRange[0] || null;
  const rankedModels = sortedByRange.slice(1, 5);
  const gridModels = filtered.slice(0, visibleCount);

  function highlightMatch(text: string, query: string) {
    if (!query || query.length < 2) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: '#fef3c7', borderRadius: 2 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  }

  const typeCount = (type: string) => models.filter(m => (m.model_type || 'BEV') === type).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* ZONE 1 — Page header */}
      <div className="px-6 pt-8 pb-2 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground">{tr('evdb_title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {kbStats?.models ?? REGION_COUNTS[filters.region] ?? '…'} {tr('evdb_subtitle')}
        </p>
      </div>

      {/* ZONE 2 — Search + Filter bar */}
      <div
        className="sticky top-0 z-20 bg-white border-b px-6 py-3"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={tr('evdb_searchPlaceholder')}
              value={filters.search}
              onChange={e => {
                setFilters(f => ({ ...f, search: e.target.value }));
                setSearchDropdownOpen(e.target.value.length >= 2);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              onFocus={() => filters.search.length >= 2 && setSearchDropdownOpen(true)}
              onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 200)}
              className="w-full py-2 pl-9 pr-9 text-sm rounded-[10px] outline-none"
              style={{ border: '1px solid #e2e8f0' }}
            />
            {filters.search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={clearSearch}
                style={{ color: '#94a3b8' }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Dropdown */}
            {searchDropdownOpen && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-30 overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                {searchSuggestions.map((s, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-2"
                    onMouseDown={() => {
                      setSelectedModel({ make: s.make, model: s.model });
                      setSearchDropdownOpen(false);
                    }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[s.type]?.dot || '#94a3b8' }} />
                    <span className="flex-1">{highlightMatch(s.label, filters.search)}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
                      backgroundColor: TYPE_COLORS[s.type]?.bg,
                      color: TYPE_COLORS[s.type]?.text,
                    }}>{s.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto md:flex-shrink-0 no-scrollbar">
            <button
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
              style={activeTypes.size === 0
                ? { backgroundColor: '#0f172a', color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
              }
              onClick={() => setActiveTypes(new Set())}
            >
              {tr('evdb_filterAll')} ({models.length})
            </button>
            {(['BEV', 'PHEV', 'HEV', 'MHEV'] as const).map(type => {
              const tc = TYPE_COLORS[type];
              const active = activeTypes.has(type);
              return (
                <button
                  key={type}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                  style={active
                    ? { backgroundColor: tc.activeBg, color: 'white' }
                    : { backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }
                  }
                  onClick={() => toggleType(type)}
                >
                  {tr(`evdb_filter${type}`)} ({typeCount(type)})
                </button>
              );
            })}

            {/* Region toggle */}
            <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 ml-2">
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setFilters(f => ({ ...f, region: r }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
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
        </div>
      </div>

      {/* ZONE 3 — Magazine content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl p-3 bg-white" style={{ border: '1px solid #e2e8f0' }}>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-[3px] w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* STATE A: Default — Featured hero + grid */}
            {!isSearchActive && (
              <div className="transition-all duration-300">
                {/* A1 — Featured hero */}
                {featuredModel && (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-3 mb-6">
                    {/* Featured big card */}
                    <div
                      className="rounded-2xl p-7 relative overflow-hidden cursor-pointer min-h-[220px] flex flex-col justify-between"
                      style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1d4ed8 100%)' }}
                      onClick={() => setSelectedModel({ make: featuredModel.make, model: featuredModel.model })}
                    >
                      <div>
                        <span
                          className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full inline-block"
                          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                        >
                          {tr('evdb_featured')}
                        </span>
                        <div className="mt-2.5 text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
                          {featuredModel.make} {featuredModel.model}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {featuredModel.battery_kwh} kWh · {featuredModel.range_km_wltp} km WLTP
                        </div>
                        <div className="flex gap-5 mt-3.5">
                          {[
                            { val: `${featuredModel.battery_kwh}`, lbl: 'kWh' },
                            { val: `${featuredModel.range_km_wltp}`, lbl: 'km WLTP' },
                            ...(featuredModel.fast_charge_kw ? [{ val: `${featuredModel.fast_charge_kw}`, lbl: 'kW DC' }] : []),
                            { val: `${Math.round((featuredModel.data_confidence ?? 0) * 100)}%`, lbl: tr('evdb_confidence') },
                          ].map((s, i) => (
                            <div key={i}>
                              <div className="text-base font-bold text-white">{s.val}</div>
                              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.lbl}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        className="mt-4 text-[11px] font-bold px-4 py-1.5 rounded-full inline-block self-start"
                        style={{ backgroundColor: 'white', color: '#1d4ed8' }}
                        onClick={e => { e.stopPropagation(); setSelectedModel({ make: featuredModel.make, model: featuredModel.model }); }}
                      >
                        {tr('evdb_featuredCta')}
                      </button>
                    </div>

                    {/* Ranked list */}
                    <div className="flex flex-col gap-2">
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>
                        {tr('evdb_topRanked')}
                      </div>
                      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
                        {rankedModels.map((m, i) => {
                          const tc = TYPE_COLORS[m.model_type || 'BEV'] || TYPE_COLORS.BEV;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 rounded-[10px] p-2.5 px-3.5 cursor-pointer hover:shadow-sm transition-shadow bg-white min-w-[180px] md:min-w-0"
                              style={{ border: '1px solid #e2e8f0' }}
                              onClick={() => setSelectedModel({ make: m.make, model: m.model })}
                            >
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tc.dot }} />
                              <span className="text-xs font-bold flex-1 truncate" style={{ color: '#0f172a' }}>
                                {m.make} {m.model}
                              </span>
                              <span className="text-[11px] whitespace-nowrap" style={{ color: '#64748b' }}>
                                {m.range_km_wltp} km · {m.battery_kwh} kWh
                              </span>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: tc.bg, color: tc.text }}
                              >
                                {m.model_type || 'BEV'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section label */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8', letterSpacing: '0.1em' }}>
                {isSearchActive
                  ? `${tr('evdb_searchResults')} (${filtered.length})`
                  : tr('evdb_allModels')
                }
              </div>
              {isSearchActive && (
                <button
                  className="text-xs font-semibold cursor-pointer"
                  style={{ color: '#1d4ed8' }}
                  onClick={clearSearch}
                >
                  {tr('evdb_backToMain')}
                </button>
              )}
            </div>

            {/* A2 / State B — Compact grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-lg font-bold text-foreground">{tr('evdb_noResults')}</div>
                <div className="text-sm text-muted-foreground mt-1">{tr('evdb_noResultsSub')}</div>
              </div>
            ) : (
              <>
                <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {gridModels.map((m, i) => {
                    const type = m.model_type || 'BEV';
                    const tc = TYPE_COLORS[type] || TYPE_COLORS.BEV;
                    const confPct = Math.round((m.data_confidence ?? 0) * 100);
                    const rangePercent = Math.round(((m.range_km_wltp || 0) / maxRange) * 100);

                    return (
                      <div
                        key={`${m.make}-${m.model}-${m.variant}-${i}`}
                        ref={selectedModel?.make === m.make && selectedModel?.model === m.model ? autoOpenCardRef : undefined}
                        className="rounded-xl p-3 bg-white cursor-pointer transition-all hover:shadow-md"
                        style={{ border: '1px solid #e2e8f0' }}
                        onClick={() => setSelectedModel({ make: m.make, model: m.model })}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="text-[11px] font-bold flex-1 truncate" style={{ color: '#0f172a' }}>
                            {isSearchActive ? highlightMatch(`${m.make} ${m.model}`, filters.search) : `${m.make} ${m.model}`}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg, color: tc.text }}>
                            {type}
                          </span>
                        </div>

                        {/* Stats 2x2 */}
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          <div className="bg-muted/40 rounded-md py-1 px-1.5 text-center">
                            <div className="text-xs font-bold" style={{ color: '#0f172a' }}>{m.battery_kwh || '—'}</div>
                            <div className="text-[8px]" style={{ color: '#94a3b8' }}>kWh</div>
                          </div>
                          <div className="bg-muted/40 rounded-md py-1 px-1.5 text-center">
                            <div className="text-xs font-bold" style={{ color: '#0f172a' }}>{m.range_km_wltp || '—'}</div>
                            <div className="text-[8px]" style={{ color: '#94a3b8' }}>km</div>
                          </div>
                          <div className="bg-muted/40 rounded-md py-1 px-1.5 text-center">
                            <div className="text-xs font-bold" style={{ color: '#0f172a' }}>{(m as any).ac_charge_kw || '—'}</div>
                            <div className="text-[8px]" style={{ color: '#94a3b8' }}>kW AC</div>
                          </div>
                          <div className="bg-muted/40 rounded-md py-1 px-1.5 text-center">
                            <div className="text-xs font-bold" style={{ color: '#0f172a' }}>{m.fast_charge_kw || '—'}</div>
                            <div className="text-[8px]" style={{ color: '#94a3b8' }}>kW DC</div>
                          </div>
                        </div>

                        {/* Range bar */}
                        <div className="h-[3px] rounded-full mb-2" style={{ backgroundColor: '#e2e8f0' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${rangePercent}%`, backgroundColor: tc.dot }} />
                        </div>

                        {/* Details link */}
                        <button
                          className="text-[10px] font-bold"
                          style={{ color: tc.text }}
                          onClick={e => { e.stopPropagation(); setSelectedModel({ make: m.make, model: m.model }); }}
                        >
                          {tr('evdb_details')}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Load more */}
                {visibleCount < filtered.length && (
                  <div className="text-center mt-6">
                    <button
                      className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
                      style={{ backgroundColor: '#f1f5f9', color: '#1d4ed8', border: '1px solid #e2e8f0' }}
                      onClick={() => setVisibleCount(v => v + ITEMS_PER_PAGE)}
                    >
                      {tr('evdb_loadMore')} ({filtered.length - visibleCount})
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div className="mt-10 text-center text-xs text-muted-foreground">
              {l('footer')}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedModel} onOpenChange={open => { if (!open) setSelectedModel(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <DetailRow label={l('spec_battery')} value={`${detail.battery_kwh} kWh`} />
                <DetailRow label={l('spec_wltp')} value={`${detail.range_km_wltp} km`} />
                <DetailRow label={l('spec_real_range')} value={`${detail.real_range_80pct_km} km`} />
                <DetailRow label={l('spec_warranty')} value={`${detail.warranty_battery_years} ${l('warranty_format')} / ${(detail.warranty_battery_km || 0).toLocaleString(lang === 'DE' ? 'de-DE' : lang === 'EN' ? 'en-US' : 'hu-HU')} km`} />
                <DetailRow label={l('spec_connector')} value={detail.connector_type} />
                <DetailRow label={l('spec_ota')} value={detail.ota_updates} />
                <DetailRow label={l('spec_adas')} value={detail.adas_level} />
              </div>

              {detail.degradation_risk && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{l('degradation')}</span>
                  <Badge
                    className={`text-xs border cursor-pointer hover:opacity-80 transition-opacity ${degradationColor[detail.degradation_risk?.toUpperCase()] || 'bg-muted text-muted-foreground'}`}
                    onClick={() => {
                      setSavedDetail({
                        ...detail,
                        _make: selectedModel?.make,
                        _model: selectedModel?.model,
                        _model_type: models.find(m => m.make === selectedModel?.make && m.model === selectedModel?.model)?.model_type || 'BEV',
                      });
                      setDegModalOpen(true);
                      setSelectedModel(null);
                    }}
                  >
                    {detail.degradation_risk}
                  </Badge>
                </div>
              )}

              {detail.rental_battery === true && (
                <Alert variant="destructive" className="py-2 px-3">
                  <AlertDescription className="text-xs font-semibold">
                    ⚠ {l('rental_battery_warn')}
                  </AlertDescription>
                </Alert>
              )}

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

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{l('data_quality')}</span>
                  <span>{Math.round((detail.data_confidence ?? 0) * 100)}%</span>
                </div>
                <Progress value={Math.round((detail.data_confidence ?? 0) * 100)} className="h-1.5" />
              </div>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  const modelType = models.find(m => m.make === selectedModel?.make && m.model === selectedModel?.model)?.model_type || 'BEV';
                  setInspectionModel({
                    make: selectedModel!.make,
                    model: selectedModel!.model,
                    variant: '',
                    battery_kwh: detail.battery_kwh,
                    model_type: modelType,
                    range_km_wltp: detail.range_km_wltp,
                    cell_chemistry: null,
                    ...detail,
                  });
                  setInspectionOpen(true);
                }}
              >
                <Microscope className="h-4 w-4 mr-2" />
                🔬 Akkumulátor / Hajtáslánc előellenőrzés
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating compare bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
            <div className="flex items-center gap-3">
              <GitCompareArrows className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {compareList.length} {l('compare_selected')}
              </span>
              <div className="flex gap-1.5">
                {compareList.map(key => {
                  const [make, model] = key.split('::');
                  return (
                    <Badge key={key} variant="secondary" className="text-xs gap-1">
                      {make} {model}
                      <button
                        onClick={() => setCompareList(prev => prev.filter(k => k !== key))}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>
                {l('compare_clear')}
              </Button>
              <Button size="sm" disabled={compareList.length < 2} onClick={openCompare}>
                <GitCompareArrows className="h-4 w-4 mr-1.5" />
                {l('compare')} ({compareList.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5" />
              {l('compare_models')}
            </DialogTitle>
          </DialogHeader>

          {compareLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium min-w-[140px]" />
                    {compareList.map(key => {
                      const [make, model] = key.split('::');
                      return (
                        <th key={key} className="text-left py-2 px-3 font-bold text-foreground min-w-[160px]">
                          {make} {model}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['spec_battery', 'battery_kwh', ' kWh'],
                    ['spec_wltp', 'range_km_wltp', ' km'],
                    ['spec_real_range', 'real_range_80pct_km', ' km'],
                    ['spec_warranty', 'warranty_battery_years', ` ${l('warranty_format')}`],
                    ['spec_connector', 'connector_type', ''],
                    ['spec_ota', 'ota_updates', ''],
                    ['spec_adas', 'adas_level', ''],
                    ['degradation', 'degradation_risk', ''],
                  ] as [string, string, string][]).map(([labelKey, field, suffix]) => (
                    <tr key={field} className="border-b border-border/50">
                      <td className="py-2 px-3 text-muted-foreground">{l(labelKey)}</td>
                      {compareList.map(key => {
                        const d = compareDetails[key];
                        const val = d?.[field];
                        return (
                          <td key={key} className="py-2 px-3 font-medium text-foreground">
                            {val != null ? `${val}${suffix}` : l('compare_no_data')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">🔋 Rental</td>
                    {compareList.map(key => {
                      const d = compareDetails[key];
                      return (
                        <td key={key} className="py-2 px-3">
                          {d?.rental_battery ? (
                            <Badge variant="destructive" className="text-xs">⚠</Badge>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-muted-foreground">{l('data_quality')}</td>
                    {compareList.map(key => {
                      const d = compareDetails[key];
                      const pct = Math.round((d?.data_confidence ?? 0) * 100);
                      return (
                        <td key={key} className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Battery Inspection Wizard */}
      {inspectionModel && (
        <BatteryInspectionWizard
          open={inspectionOpen}
          onOpenChange={setInspectionOpen}
          modelData={inspectionModel}
        />
      )}

      {/* Degradation Detail Modal */}
      {(savedDetail || detail) && (savedDetail || detail).degradation_risk && (
        <DegradationDetailModal
          open={degModalOpen}
          onOpenChange={(open) => { setDegModalOpen(open); if (!open) setSavedDetail(null); }}
          data={{
            degradation_risk: (savedDetail || detail).degradation_risk,
            battery_kwh: (savedDetail || detail).battery_kwh,
            range_km_wltp: (savedDetail || detail).range_km_wltp,
            cell_chemistry: ((savedDetail || detail) as any).cell_chemistry,
            fault_codes: (savedDetail || detail).fault_codes,
            rental_battery: (savedDetail || detail).rental_battery,
            known_issues: ((savedDetail || detail) as any).known_issues,
            warranty_battery_years: (savedDetail || detail).warranty_battery_years,
            model_type: (savedDetail as any)?._model_type || models.find(m => m.make === selectedModel?.make && m.model === selectedModel?.model)?.model_type,
            make: (savedDetail as any)?._make || selectedModel?.make,
            model: (savedDetail as any)?._model || selectedModel?.model,
          }}
          onOpenWizard={() => {
            setDegModalOpen(false);
            setSavedDetail(null);
            const modelType = models.find(m => m.make === selectedModel?.make && m.model === selectedModel?.model)?.model_type || 'BEV';
            setInspectionModel({
              make: selectedModel!.make,
              model: selectedModel!.model,
              variant: '',
              battery_kwh: (savedDetail || detail).battery_kwh,
              model_type: modelType,
              range_km_wltp: (savedDetail || detail).range_km_wltp,
              cell_chemistry: null,
              ...(savedDetail || detail),
            });
            setInspectionOpen(true);
          }}
        />
      )}

      {/* Hide scrollbar utility */}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
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

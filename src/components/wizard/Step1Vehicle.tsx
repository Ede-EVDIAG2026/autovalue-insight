import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings2, Zap, Loader2 } from 'lucide-react';
import { VehicleData } from '@/pages/AutoValuePage';

/* ─── API types ─── */
interface MakeEntry {
  make: string;
  listings: number;
  models: number;
}

interface ModelEntry {
  model: string;
  powertrains: string[];
  total_listings: number;
  year_from: number;
  year_to: number;
}

/* ─── Fuel type options ─── */
const FUEL_TYPES = [
  { value: 'BEV', label: 'BEV – Teljesen elektromos' },
  { value: 'PHEV', label: 'PHEV – Plug-in hibrid' },
  { value: 'HEV', label: 'HEV – Önfeltöltős hibrid' },
  { value: 'MHEV', label: 'MHEV – Enyhe hibrid' },
];

const COUNTRIES = [
  { value: 'HU', label: '🇭🇺 Magyarország' },
  { value: 'DE', label: '🇩🇪 Deutschland' },
  { value: 'AT', label: '🇦🇹 Österreich' },
  { value: 'SK', label: '🇸🇰 Slovensko' },
  { value: 'CZ', label: '🇨🇿 Česko' },
];

const Step1Vehicle = ({ onNext }: { onNext: (data: VehicleData) => void }) => {
  const { tr } = useLanguage();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('BEV');
  const [priceEur, setPriceEur] = useState('');
  const [country, setCountry] = useState('HU');

  // Optional
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [engine, setEngine] = useState('');
  const [trimLevel, setTrimLevel] = useState('');
  const [condition, setCondition] = useState('');

  // Cascade API state
  const [makes, setMakes] = useState<MakeEntry[]>([]);
  const [makesLoading, setMakesLoading] = useState(true);
  const [makesFailed, setMakesFailed] = useState(false);
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsFailed, setModelsFailed] = useState(false);

  // Cache refs
  const makesCache = useRef<MakeEntry[] | null>(null);
  const modelsCache = useRef<Record<string, ModelEntry[]>>({});

  const years = Array.from({ length: 12 }, (_, i) => 2026 - i);
  const canSubmit = make && model && year && mileage;

  /* ─── Fetch makes ─── */
  useEffect(() => {
    if (makesCache.current) {
      setMakes(makesCache.current);
      setMakesLoading(false);
      return;
    }
    const fetchMakes = async () => {
      try {
        const { MARKET_API } = await import('@/lib/marketApi');
        const res = await fetch(`${MARKET_API}/api/v1/market/makes`);
        if (!res.ok) throw new Error('fail');
        const json = await res.json();
        const data: MakeEntry[] = json.makes || [];
        makesCache.current = data;
        setMakes(data);
      } catch {
        setMakesFailed(true);
      } finally {
        setMakesLoading(false);
      }
    };
    fetchMakes();
  }, []);

  /* ─── Fetch models when make changes ─── */
  useEffect(() => {
    if (!make) {
      setModels([]);
      return;
    }
    if (modelsCache.current[make]) {
      setModels(modelsCache.current[make]);
      return;
    }
    const fetchModels = async () => {
      setModelsLoading(true);
      setModelsFailed(false);
      try {
        const { MARKET_API } = await import('@/lib/marketApi');
        const res = await fetch(`${MARKET_API}/api/v1/market/models?make=${encodeURIComponent(make)}`);
        if (!res.ok) throw new Error('fail');
        const json = await res.json();
        const data: ModelEntry[] = json.models || [];
        modelsCache.current[make] = data;
        setModels(data);
      } catch {
        setModelsFailed(true);
        setModels([]);
      } finally {
        setModelsLoading(false);
      }
    };
    fetchModels();
  }, [make]);

  /* ─── Auto-select fuel type if model has single powertrain ─── */
  useEffect(() => {
    if (!model || models.length === 0) return;
    const found = models.find(m => m.model === model);
    if (found && found.powertrains.length === 1) {
      setFuelType(found.powertrains[0]);
    }
  }, [model, models]);

  const handleMakeChange = (v: string) => {
    setMake(v);
    setModel('');
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const data: VehicleData & { vehicle_price_eur?: number } = {
      vehicle_make: make,
      vehicle_model: model,
      vehicle_year: parseInt(year),
      vehicle_mileage_km: parseInt(mileage),
      vehicle_color: '',
      vehicle_fuel_type: fuelType,
      service_book: false,
      owners_count: 1,
      accident_free: true,
      target_country: country,
    };
    if (priceEur && parseInt(priceEur) > 0) {
      (data as any).vehicle_price_eur = parseInt(priceEur);
    }
    onNext(data as VehicleData);
  };

  /* ─── Fallback make input ─── */
  const renderMakeField = () => {
    if (makesFailed) {
      return (
        <Input
          placeholder="pl. Tesla"
          value={make}
          onChange={e => handleMakeChange(e.target.value)}
        />
      );
    }
    return (
      <Select value={make} onValueChange={handleMakeChange}>
        <SelectTrigger>
          <SelectValue placeholder={makesLoading ? 'Betöltés...' : 'Válassz gyártót...'} />
        </SelectTrigger>
        <SelectContent>
          {makesLoading ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Betöltés...
            </div>
          ) : (
            makes.map(m => (
              <SelectItem key={m.make} value={m.make}>
                {m.make}  ({m.listings} hirdetés)
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  /* ─── Fallback model input ─── */
  const renderModelField = () => {
    if (modelsFailed) {
      return (
        <Input
          placeholder="pl. Model 3"
          value={model}
          onChange={e => setModel(e.target.value)}
          disabled={!make}
        />
      );
    }
    return (
      <Select value={model} onValueChange={setModel} disabled={!make || modelsLoading}>
        <SelectTrigger>
          <SelectValue placeholder={modelsLoading ? 'Betöltés...' : 'Válassz modellt...'} />
        </SelectTrigger>
        <SelectContent>
          {modelsLoading ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Betöltés...
            </div>
          ) : (
            models.map(m => (
              <SelectItem key={m.model} value={m.model}>
                {m.model}  ·  {m.year_from}–{m.year_to}  ·  {m.total_listings} db
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="glass-card p-8 animate-slide-up">
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">{tr('step1_title')}</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Gyors becslés – 5 mező, 10 másodperc.
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Make */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">{tr('make')} *</Label>
          {renderMakeField()}
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">{tr('model')} *</Label>
          {renderModelField()}
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">{tr('year')} *</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue placeholder="Évjárat..." /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Mileage */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">{tr('mileage')} *</Label>
          <Input
            type="number"
            placeholder="pl. 45000"
            value={mileage}
            onChange={e => setMileage(e.target.value)}
          />
        </div>

        {/* Price EUR (optional) */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">Hirdetési ár (EUR)</Label>
          <Input
            type="number"
            placeholder="pl. 28000"
            value={priceEur}
            onChange={e => setPriceEur(e.target.value)}
          />
        </div>

        {/* Fuel type */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">Hajtáslánc *</Label>
          <Select value={fuelType} onValueChange={setFuelType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-foreground text-sm">{tr('target_market')}</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Optional fields */}
      <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen} className="mt-5">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
          <Settings2 className="h-4 w-4" />
          Pontosítás (opcionális)
          <ChevronDown className={`h-4 w-4 transition-transform ${optionalOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">{tr('engine')}</Label>
              <Input placeholder="pl. 60 kWh" value={engine} onChange={e => setEngine(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Felszereltség</Label>
              <Input placeholder="pl. Premium, Sport" value={trimLevel} onChange={e => setTrimLevel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Állapot</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue placeholder="Válassz..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Kiváló</SelectItem>
                  <SelectItem value="good">Jó</SelectItem>
                  <SelectItem value="fair">Elfogadható</SelectItem>
                  <SelectItem value="poor">Gyenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Submit */}
      <Button
        className="w-full mt-7 hero-gradient text-lg py-6"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        <Zap className="h-5 w-5 mr-1" />
        {tr('start_valuation')}
      </Button>

      {/* Microcopy */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Az EV DIAG gyors becslést készít néhány alapadat alapján. A részletesebb elemzés később opcionálisan elérhető.
      </p>
    </div>
  );
};

export default Step1Vehicle;

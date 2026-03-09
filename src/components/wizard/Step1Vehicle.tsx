import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings2, Zap } from 'lucide-react';
import { VehicleData } from '@/pages/AutoValuePage';

const MAKES_MODELS: Record<string, string[]> = {
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Volkswagen: ['ID.3', 'ID.4', 'ID.5', 'ID.7', 'e-Golf'],
  BMW: ['i3', 'i4', 'i5', 'iX', 'iX1', 'iX3'],
  'Mercedes-Benz': ['EQA', 'EQB', 'EQC', 'EQE', 'EQS'],
  Hyundai: ['Ioniq 5', 'Ioniq 6', 'Kona Electric'],
  Kia: ['EV6', 'EV9', 'e-Niro', 'e-Soul'],
  Audi: ['e-tron', 'e-tron GT', 'Q4 e-tron', 'Q8 e-tron'],
  Porsche: ['Taycan', 'Macan Electric'],
  Volvo: ['XC40 Recharge', 'C40 Recharge', 'EX30', 'EX90'],
  Polestar: ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  Renault: ['Megane E-Tech', 'Zoe', 'Scenic E-Tech'],
  Nissan: ['Leaf', 'Ariya'],
  Stellantis: ['Opel Corsa-e', 'Peugeot e-208', 'Peugeot e-2008', 'Citroën ë-C4'],
  BYD: ['Atto 3', 'Seal', 'Dolphin', 'Tang EV'],
  NIO: ['ET5', 'ET7', 'EL7', 'EL8'],
};

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
  const [country, setCountry] = useState('HU');

  // Optional
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [engine, setEngine] = useState('');
  const [trimLevel, setTrimLevel] = useState('');
  const [condition, setCondition] = useState('');

  const models = make ? MAKES_MODELS[make] || [] : [];
  const years = Array.from({ length: 12 }, (_, i) => 2026 - i);

  const canSubmit = make && model && year && mileage;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onNext({
      vehicle_make: make,
      vehicle_model: model,
      vehicle_year: parseInt(year),
      vehicle_mileage_km: parseInt(mileage),
      vehicle_color: '',
      vehicle_fuel_type: 'BEV',
      service_book: false,
      owners_count: 1,
      accident_free: true,
      target_country: country,
    });
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
          <Select value={make} onValueChange={v => { setMake(v); setModel(''); }}>
            <SelectTrigger><SelectValue placeholder="Válassz gyártót..." /></SelectTrigger>
            <SelectContent>
              {Object.keys(MAKES_MODELS).map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">{tr('model')} *</Label>
          <Select value={model} onValueChange={setModel} disabled={!make}>
            <SelectTrigger><SelectValue placeholder="Válassz modellt..." /></SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
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

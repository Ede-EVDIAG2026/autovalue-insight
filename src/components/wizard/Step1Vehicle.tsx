import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Link2, Settings2 } from 'lucide-react';
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
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState('BEV');
  const [serviceBook, setServiceBook] = useState(false);
  const [owners, setOwners] = useState('1');
  const [accidentFree, setAccidentFree] = useState(true);
  const [country, setCountry] = useState('HU');
  const [linkedResultId, setLinkedResultId] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [equipment, setEquipment] = useState('');

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
      vehicle_color: color,
      vehicle_fuel_type: fuelType,
      service_book: serviceBook,
      owners_count: parseInt(owners),
      accident_free: accidentFree,
      target_country: country,
      linked_result_id: linkedResultId || undefined,
    });
  };

  return (
    <div className="glass-card p-8 animate-slide-up">
      <h2 className="text-2xl font-display font-bold text-foreground mb-8">{tr('step1_title')}</h2>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Make */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('make')} *</Label>
          <Select value={make} onValueChange={v => { setMake(v); setModel(''); }}>
            <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
            <SelectContent>
              {Object.keys(MAKES_MODELS).map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('model')} *</Label>
          <Select value={model} onValueChange={setModel} disabled={!make}>
            <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('year')} *</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Mileage */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('mileage')} *</Label>
          <Input 
            type="number" 
            placeholder="45000" 
            value={mileage} 
            onChange={e => setMileage(e.target.value)} 
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('color')}</Label>
          <Input placeholder="Fehér" value={color} onChange={e => setColor(e.target.value)} />
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('fuel_type')}</Label>
          <Select value={fuelType} onValueChange={setFuelType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BEV">BEV</SelectItem>
              <SelectItem value="PHEV">PHEV</SelectItem>
              <SelectItem value="HEV">HEV</SelectItem>
              <SelectItem value="MHEV">MHEV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Book */}
        <div className="flex items-center justify-between sm:col-span-2 py-2">
          <Label className="text-foreground">{tr('service_book')}</Label>
          <Switch checked={serviceBook} onCheckedChange={setServiceBook} />
        </div>

        {/* Accident Free */}
        <div className="flex items-center justify-between sm:col-span-2 py-2">
          <Label className="text-foreground">{tr('accident_free')}</Label>
          <Switch checked={accidentFree} onCheckedChange={setAccidentFree} />
        </div>

        {/* Owners */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('owners')}</Label>
          <Select value={owners} onValueChange={setOwners}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>{n}{n === 5 ? '+' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Market */}
        <div className="space-y-2">
          <Label className="text-foreground">{tr('target_market')}</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Suite Link */}
      <Collapsible open={linkOpen} onOpenChange={setLinkOpen} className="mt-6">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
          <Link2 className="h-4 w-4" />
          {tr('link_audit')}
          <ChevronDown className={`h-4 w-4 transition-transform ${linkOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <Label className="text-foreground text-sm">Result ID</Label>
            <Input 
              placeholder="Paste result ID here..."
              value={linkedResultId}
              onChange={e => setLinkedResultId(e.target.value)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Submit */}
      <Button 
        className="w-full mt-8 hero-gradient text-lg py-6"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {tr('start_valuation')}
      </Button>
    </div>
  );
};

export default Step1Vehicle;

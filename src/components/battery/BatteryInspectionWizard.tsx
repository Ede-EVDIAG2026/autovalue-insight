import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2, Microscope, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';
import BatteryInspectionResults, { type InspectionResult } from './BatteryInspectionResults';

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelData: {
    make: string;
    model: string;
    variant: string;
    battery_kwh: number | null;
    model_type: string;
    range_km_wltp?: number | null;
    fast_charge_kw?: number | null;
    cell_chemistry?: string | null;
    [key: string]: any;
  };
}

type PowertrainType = 'BEV' | 'PHEV' | 'HEV' | 'MHEV';

const tx: Record<string, Record<Lang, string>> = {
  title: { HU: '🔬 Akkumulátor / Hajtáslánc előellenőrzés', EN: '🔬 Battery / Powertrain Pre-Inspection', DE: '🔬 Batterie / Antrieb Vorabprüfung' },
  step1_title: { HU: 'Jármű alapadatok', EN: 'Vehicle basics', DE: 'Fahrzeug-Grunddaten' },
  step2_title: { HU: 'Futásteljesítmény és életkor', EN: 'Mileage & age', DE: 'Kilometerstand & Alter' },
  step3_title: { HU: 'Töltési szokások', EN: 'Charging habits', DE: 'Ladegewohnheiten' },
  step4_title: { HU: 'Felhasználási szokások', EN: 'Usage patterns', DE: 'Nutzungsmuster' },
  step5_title: { HU: 'Területi és üzemeltetési előzmények', EN: 'Regional & operational history', DE: 'Regional- & Betriebshistorie' },
  step6_title: { HU: 'Belső égésű motor állapot', EN: 'ICE engine condition', DE: 'Verbrennungsmotor-Zustand' },
  next: { HU: 'Tovább', EN: 'Next', DE: 'Weiter' },
  back: { HU: 'Vissza', EN: 'Back', DE: 'Zurück' },
  analyze: { HU: 'Elemzés indítása', EN: 'Start analysis', DE: 'Analyse starten' },
  make: { HU: 'Gyártó', EN: 'Make', DE: 'Hersteller' },
  model: { HU: 'Modell', EN: 'Model', DE: 'Modell' },
  variant: { HU: 'Változat', EN: 'Variant', DE: 'Variante' },
  year: { HU: 'Gyártási év', EN: 'Year', DE: 'Baujahr' },
  battery_cap: { HU: 'Akkumulátor névleges kapacitás (kWh)', EN: 'Nominal battery capacity (kWh)', DE: 'Nominale Batteriekapazität (kWh)' },
  mileage: { HU: 'Jelenlegi km-óra állás', EN: 'Current odometer (km)', DE: 'Aktueller km-Stand' },
  first_reg: { HU: 'Első forgalomba helyezés', EN: 'First registration', DE: 'Erstzulassung' },
  owners: { HU: 'Hány tulajdonos volt eddig?', EN: 'How many previous owners?', DE: 'Wie viele Vorbesitzer?' },
  service_book: { HU: 'Szervizkönyv / szervizhistória?', EN: 'Service book / history?', DE: 'Serviceheft / Historie?' },
  yes: { HU: 'Igen', EN: 'Yes', DE: 'Ja' },
  partial: { HU: 'Részleges', EN: 'Partial', DE: 'Teilweise' },
  no: { HU: 'Nem', EN: 'No', DE: 'Nein' },
  min_soc: { HU: 'Jellemző minimum SoC szint', EN: 'Typical minimum SoC level', DE: 'Typisches Minimum-SoC' },
  max_soc: { HU: 'Jellemző maximum SoC szint', EN: 'Typical maximum SoC level', DE: 'Typisches Maximum-SoC' },
  full_charge_freq: { HU: 'Mennyire gyakran töltötték 100%-ra?', EN: 'How often charged to 100%?', DE: 'Wie oft auf 100% geladen?' },
  never: { HU: 'Soha', EN: 'Never', DE: 'Nie' },
  monthly: { HU: 'Havonta', EN: 'Monthly', DE: 'Monatlich' },
  weekly: { HU: 'Hetente', EN: 'Weekly', DE: 'Wöchentlich' },
  daily: { HU: 'Naponta', EN: 'Daily', DE: 'Täglich' },
  dc_freq: { HU: 'DC gyorstöltés gyakorisága?', EN: 'DC fast charging frequency?', DE: 'DC-Schnellladen Häufigkeit?' },
  occasionally: { HU: 'Alkalmanként', EN: 'Occasionally', DE: 'Gelegentlich' },
  regularly: { HU: 'Rendszeresen', EN: 'Regularly', DE: 'Regelmäßig' },
  mostly_dc: { HU: 'Főleg DC-vel', EN: 'Mostly DC', DE: 'Überwiegend DC' },
  dc_power: { HU: 'Jellemző DC töltési teljesítmény (kW)', EN: 'Typical DC charge power (kW)', DE: 'Typische DC-Ladeleistung (kW)' },
  charge_cycles: { HU: 'Becsült töltési ciklusok (opcionális)', EN: 'Estimated charge cycles (optional)', DE: 'Geschätzte Ladezyklen (optional)' },
  usage_type: { HU: 'Jellemző használat', EN: 'Typical usage', DE: 'Typische Nutzung' },
  city: { HU: 'Város', EN: 'City', DE: 'Stadt' },
  mixed: { HU: 'Vegyes', EN: 'Mixed', DE: 'Gemischt' },
  highway: { HU: 'Főleg autópálya', EN: 'Mostly highway', DE: 'Überwiegend Autobahn' },
  daily_km: { HU: 'Átlagos napi futás (km)', EN: 'Average daily distance (km)', DE: 'Durchschn. Tagesstrecke (km)' },
  load: { HU: 'Jellemző terhelés', EN: 'Typical load', DE: 'Typische Belastung' },
  driver_only: { HU: 'Csak vezető', EN: 'Driver only', DE: 'Nur Fahrer' },
  passengers: { HU: 'Rendszeres utasok', EN: 'Regular passengers', DE: 'Regelmäßige Mitfahrer' },
  towing: { HU: 'Vontatás / rakodás', EN: 'Towing / cargo', DE: 'Anhänger / Fracht' },
  climate: { HU: 'Éghajlati zóna', EN: 'Climate zone', DE: 'Klimazone' },
  cold: { HU: 'Hideg (-10°C alatti telek)', EN: 'Cold (winters below -10°C)', DE: 'Kalt (Winter unter -10°C)' },
  moderate: { HU: 'Mérsékelt', EN: 'Moderate', DE: 'Gemäßigt' },
  hot: { HU: 'Meleg (35°C+)', EN: 'Hot (35°C+)', DE: 'Heiß (35°C+)' },
  thermal_mgmt: { HU: 'Volt-e termikus kezelés?', EN: 'Any thermal management?', DE: 'Thermomanagement?' },
  partly: { HU: 'Részben', EN: 'Partly', DE: 'Teilweise' },
  country: { HU: 'Használat országa/régiója', EN: 'Country/region of use', DE: 'Einsatzland/Region' },
  other_eu: { HU: 'Egyéb EU', EN: 'Other EU', DE: 'Sonstiges EU' },
  other: { HU: 'Egyéb', EN: 'Other', DE: 'Sonstiges' },
  urban: { HU: 'Városi jellemző?', EN: 'Urban usage?', DE: 'Stadtverkehr?' },
  rural: { HU: 'Vidéki/autópálya', EN: 'Rural/highway', DE: 'Land/Autobahn' },
  accident: { HU: 'Baleseti sérülés, javítás?', EN: 'Accident damage/repair?', DE: 'Unfallschaden/Reparatur?' },
  none: { HU: 'Nem', EN: 'None', DE: 'Keine' },
  minor: { HU: 'Kisebb', EN: 'Minor', DE: 'Geringfügig' },
  battery_damage: { HU: 'Akkumulátort érintő', EN: 'Battery-related', DE: 'Batterie-bezogen' },
  warranty_active: { HU: 'Gyári garancia aktív?', EN: 'Factory warranty active?', DE: 'Werksgarantie aktiv?' },
  expired: { HU: 'Lejárt', EN: 'Expired', DE: 'Abgelaufen' },
  unknown: { HU: 'Nem tudja', EN: 'Unknown', DE: 'Unbekannt' },
  battery_replaced: { HU: 'Akkumulátor csere/javítás?', EN: 'Battery replacement/repair?', DE: 'Batterieaustausch/Reparatur?' },
  factory: { HU: 'Igen, gyári', EN: 'Yes, factory', DE: 'Ja, Werk' },
  authorized: { HU: 'Igen, márkaszerviz', EN: 'Yes, authorized', DE: 'Ja, Vertragswerkstatt' },
  third_party: { HU: 'Igen, külső', EN: 'Yes, third-party', DE: 'Ja, Drittanbieter' },
  last_oil: { HU: 'Utolsó olajcsere (km ezelőtt)', EN: 'Last oil change (km ago)', DE: 'Letzter Ölwechsel (km zuvor)' },
  timing: { HU: 'Fogasszíj/lánc állapot', EN: 'Timing belt/chain condition', DE: 'Zahnriemen/Kette Zustand' },
  fresh: { HU: 'Friss', EN: 'Fresh', DE: 'Frisch' },
  older: { HU: 'Régebbi', EN: 'Older', DE: 'Älter' },
  dtc_recent: { HU: 'Motorhiba (DTC) utóbbi 12 hónapban?', EN: 'Engine fault (DTC) last 12 months?', DE: 'Motorstörung (DTC) letzte 12 Monate?' },
  minor_dtc: { HU: 'Igen, kisebb', EN: 'Yes, minor', DE: 'Ja, geringfügig' },
  major_dtc: { HU: 'Igen, komoly', EN: 'Yes, major', DE: 'Ja, schwerwiegend' },
  fuel_consumption: { HU: 'Fogyasztás (l/100km)', EN: 'Fuel consumption (l/100km)', DE: 'Verbrauch (l/100km)' },
  transmission_fault: { HU: 'Automata váltóhiba?', EN: 'Automatic transmission fault?', DE: 'Automatikgetriebefehler?' },
  phev_mode: { HU: 'PHEV: jellemző üzemmód?', EN: 'PHEV: typical mode?', DE: 'PHEV: typischer Modus?' },
  mostly_ev: { HU: 'Főleg EV', EN: 'Mostly EV', DE: 'Überwiegend EV' },
  mostly_ice: { HU: 'Főleg benzin', EN: 'Mostly petrol', DE: 'Überwiegend Benzin' },
  mhev_note: { HU: 'Enyhe hibrid — az elektromos komponens korlátozott, az értékelés főként az ICE állapotára fókuszál', EN: 'Mild hybrid — limited electric component, evaluation focuses mainly on ICE condition', DE: 'Mild-Hybrid — eingeschränkte E-Komponente, Bewertung fokussiert auf Verbrennungsmotor' },
  loading_init: { HU: 'Bayes v2 modell inicializálás...', EN: 'Initializing Bayes v2 model...', DE: 'Bayes v2 Modell initialisieren...' },
  loading_degradation: { HU: 'Degradáció becslés...', EN: 'Estimating degradation...', DE: 'Degradation schätzen...' },
  loading_risk: { HU: 'Kockázati faktorok számítása...', EN: 'Calculating risk factors...', DE: 'Risikofaktoren berechnen...' },
  loading_results: { HU: 'Eredmények összeállítása...', EN: 'Compiling results...', DE: 'Ergebnisse zusammenstellen...' },
  error: { HU: 'Hiba történt az elemzés során. Kérjük próbáld újra.', EN: 'An error occurred during analysis. Please try again.', DE: 'Während der Analyse ist ein Fehler aufgetreten.' },
  skip_step: { HU: '(Nem releváns ennél a típusnál — átugorva)', EN: '(Not relevant for this type — skipped)', DE: '(Für diesen Typ nicht relevant — übersprungen)' },
};

const countries = ['HU', 'AT', 'DE', 'CZ', 'PL', 'SK', 'RO'];

export default function BatteryInspectionWizard({ open, onOpenChange, modelData }: WizardProps) {
  const { lang } = useLanguage();
  const l = (k: string) => tx[k]?.[lang] ?? tx[k]?.HU ?? k;
  const pt = (modelData.model_type || 'BEV') as PowertrainType;
  const isBEV = pt === 'BEV';
  const hasICE = !isBEV;
  const hasCharging = pt === 'BEV' || pt === 'PHEV';

  // Total steps: BEV=5, PHEV/HEV/MHEV=6
  const totalSteps = hasICE ? 6 : 5;
  const resultStep = totalSteps + 1;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InspectionResult | null>(null);

  // Step 1
  const [year, setYear] = useState(2022);
  const [batteryCap, setBatteryCap] = useState(modelData.battery_kwh ?? 0);

  // Step 2
  const [mileage, setMileage] = useState(0);
  const [firstReg, setFirstReg] = useState('');
  const [owners, setOwners] = useState('1');
  const [serviceBook, setServiceBook] = useState('yes');

  // Step 3
  const [minSoc, setMinSoc] = useState(20);
  const [maxSoc, setMaxSoc] = useState(80);
  const [fullChargeFreq, setFullChargeFreq] = useState('never');
  const [dcFreq, setDcFreq] = useState('never');
  const [dcPower, setDcPower] = useState(0);
  const [chargeCycles, setChargeCycles] = useState<number | undefined>();

  // Step 4
  const [usageType, setUsageType] = useState('mixed');
  const [dailyKm, setDailyKm] = useState(40);
  const [loadType, setLoadType] = useState('driver_only');
  const [climate, setClimate] = useState('moderate');
  const [thermalMgmt, setThermalMgmt] = useState('no');

  // Step 5
  const [country, setCountry] = useState('HU');
  const [urbanUsage, setUrbanUsage] = useState('mixed');
  const [accident, setAccident] = useState('none');
  const [warrantyActive, setWarrantyActive] = useState('unknown');
  const [batteryReplaced, setBatteryReplaced] = useState('no');

  // Step 6 (ICE)
  const [lastOilKm, setLastOilKm] = useState(0);
  const [timingState, setTimingState] = useState('unknown');
  const [dtcRecent, setDtcRecent] = useState('no');
  const [fuelConsumption, setFuelConsumption] = useState(0);
  const [transmissionFault, setTransmissionFault] = useState('no');
  const [phevMode, setPhevMode] = useState('mixed');

  const getEffectiveStep = (s: number): number => {
    // For BEV: step 3 (charging) is included, no step 6
    // For HEV/MHEV: skip step 3 (charging), so step 3 maps to step 4 content
    if (!hasCharging && s >= 3) {
      return s + 1; // skip charging step
    }
    return s;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const buildWizardData = () => ({
    powertrain_type: pt,
    vehicle: { make: modelData.make, model: modelData.model, variant: modelData.variant, year, battery_kwh: batteryCap },
    mileage_and_age: { mileage_km: mileage, first_registration: firstReg, owners_count: owners, service_book: serviceBook },
    charging_habits: hasCharging ? { min_soc: minSoc, max_soc: maxSoc, full_charge_frequency: fullChargeFreq, dc_frequency: dcFreq, dc_power_kw: dcPower, estimated_charge_cycles: chargeCycles } : null,
    usage_patterns: { usage_type: usageType, daily_km: dailyKm, load_type: loadType, climate_zone: climate, thermal_management: thermalMgmt },
    regional_history: { country, urban_usage: urbanUsage, accident_history: accident, warranty_active: warrantyActive, battery_replaced: batteryReplaced },
    ice_condition: hasICE ? { last_oil_change_km_ago: lastOilKm, timing_state: timingState, dtc_recent: dtcRecent, fuel_consumption_l100km: fuelConsumption, transmission_fault: transmissionFault, phev_mode: pt === 'PHEV' ? phevMode : null } : null,
  });

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setLoadingPhase(0);

    const phases = [0, 1, 2, 3];
    for (const p of phases) {
      setLoadingPhase(p);
      await new Promise(r => setTimeout(r, 1200));
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('battery-inspection', {
        body: { wizardData: buildWizardData(), modelData },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResult(data as InspectionResult);
      setStep(resultStep);
    } catch (e: any) {
      console.error('Analysis error:', e);
      setError(l('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [l('loading_init'), l('loading_degradation'), l('loading_risk'), l('loading_results')];

  const stepTitles: Record<number, string> = {
    1: l('step1_title'),
    2: l('step2_title'),
    3: hasCharging ? l('step3_title') : l('step4_title'),
    4: hasCharging ? l('step4_title') : l('step5_title'),
    5: hasCharging ? l('step5_title') : (hasICE ? l('step6_title') : ''),
    6: l('step6_title'),
  };

  // Which content step to render based on actual step
  const contentStep = (): number => {
    if (hasCharging) return step;
    // No charging: step 3→4, step 4→5, step 5→6
    if (step >= 3) return step + 1;
    return step;
  };

  const cs = contentStep();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">{l('title')}</h2>
          {step <= totalSteps && !loading && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{stepTitles[step]}</span>
                <span>{step} / {totalSteps}</span>
              </div>
              <Progress value={(step / totalSteps) * 100} className="h-1.5" />
            </div>
          )}
          {pt === 'MHEV' && step === 1 && (
            <div className="mt-2 flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-md">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{l('mhev_note')}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <LoadingAnimation phase={loadingPhase} messages={loadingMessages} />
          ) : step === resultStep && result ? (
            <BatteryInspectionResults result={result} showIce={hasICE} />
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  {error}
                </div>
              )}

              {/* Step content */}
              <div className="space-y-4">
                {cs === 1 && <Step1 l={l} make={modelData.make} model={modelData.model} variant={modelData.variant} year={year} setYear={setYear} batteryCap={batteryCap} setBatteryCap={setBatteryCap} />}
                {cs === 2 && <Step2 l={l} mileage={mileage} setMileage={setMileage} firstReg={firstReg} setFirstReg={setFirstReg} owners={owners} setOwners={setOwners} serviceBook={serviceBook} setServiceBook={setServiceBook} />}
                {cs === 3 && <Step3Charging l={l} minSoc={minSoc} setMinSoc={setMinSoc} maxSoc={maxSoc} setMaxSoc={setMaxSoc} fullChargeFreq={fullChargeFreq} setFullChargeFreq={setFullChargeFreq} dcFreq={dcFreq} setDcFreq={setDcFreq} dcPower={dcPower} setDcPower={setDcPower} chargeCycles={chargeCycles} setChargeCycles={setChargeCycles} />}
                {cs === 4 && <Step4Usage l={l} usageType={usageType} setUsageType={setUsageType} dailyKm={dailyKm} setDailyKm={setDailyKm} loadType={loadType} setLoadType={setLoadType} climate={climate} setClimate={setClimate} thermalMgmt={thermalMgmt} setThermalMgmt={setThermalMgmt} />}
                {cs === 5 && <Step5Regional l={l} country={country} setCountry={setCountry} urbanUsage={urbanUsage} setUrbanUsage={setUrbanUsage} accident={accident} setAccident={setAccident} warrantyActive={warrantyActive} setWarrantyActive={setWarrantyActive} batteryReplaced={batteryReplaced} setBatteryReplaced={setBatteryReplaced} />}
                {cs === 6 && <Step6ICE l={l} pt={pt} lastOilKm={lastOilKm} setLastOilKm={setLastOilKm} timingState={timingState} setTimingState={setTimingState} dtcRecent={dtcRecent} setDtcRecent={setDtcRecent} fuelConsumption={fuelConsumption} setFuelConsumption={setFuelConsumption} transmissionFault={transmissionFault} setTransmissionFault={setTransmissionFault} phevMode={phevMode} setPhevMode={setPhevMode} />}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-border">
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> {l('back')}
                </Button>
                {step < totalSteps ? (
                  <Button onClick={handleNext}>
                    {l('next')} <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleAnalyze} className="bg-primary">
                    <Microscope className="h-4 w-4 mr-1" /> {l('analyze')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Loading animation component
function LoadingAnimation({ phase, messages }: { phase: number; messages: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">{messages[phase] || messages[0]}</p>
        <Progress value={((phase + 1) / messages.length) * 100} className="h-1.5 w-48 mx-auto" />
      </div>
    </div>
  );
}

// Field helper
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            value === o.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-primary/50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Step Components
function Step1({ l, make, model, variant, year, setYear, batteryCap, setBatteryCap }: any) {
  return (
    <>
      <Field label={l('make')}>
        <Input value={make} readOnly className="bg-muted/50" />
      </Field>
      <Field label={l('model')}>
        <Input value={model} readOnly className="bg-muted/50" />
      </Field>
      {variant && (
        <Field label={l('variant')}>
          <Input value={variant} readOnly className="bg-muted/50" />
        </Field>
      )}
      <Field label={l('year')}>
        <Input type="number" min={2010} max={2026} value={year} onChange={e => setYear(Number(e.target.value))} />
      </Field>
      <Field label={l('battery_cap')}>
        <Input type="number" step={0.1} value={batteryCap} onChange={e => setBatteryCap(Number(e.target.value))} />
      </Field>
    </>
  );
}

function Step2({ l, mileage, setMileage, firstReg, setFirstReg, owners, setOwners, serviceBook, setServiceBook }: any) {
  return (
    <>
      <Field label={l('mileage')}>
        <Input type="number" placeholder="87500" value={mileage || ''} onChange={e => setMileage(Number(e.target.value))} />
      </Field>
      <Field label={l('first_reg')}>
        <Input type="date" value={firstReg} onChange={e => setFirstReg(e.target.value)} />
      </Field>
      <Field label={l('owners')}>
        <RadioGroup value={owners} onChange={setOwners} options={[
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3+', label: '3+' },
        ]} />
      </Field>
      <Field label={l('service_book')}>
        <RadioGroup value={serviceBook} onChange={setServiceBook} options={[
          { value: 'yes', label: l('yes') },
          { value: 'partial', label: l('partial') },
          { value: 'no', label: l('no') },
        ]} />
      </Field>
    </>
  );
}

function Step3Charging({ l, minSoc, setMinSoc, maxSoc, setMaxSoc, fullChargeFreq, setFullChargeFreq, dcFreq, setDcFreq, dcPower, setDcPower, chargeCycles, setChargeCycles }: any) {
  return (
    <>
      <Field label={`${l('min_soc')}: ${minSoc}%`}>
        <Slider min={0} max={50} step={5} value={[minSoc]} onValueChange={v => setMinSoc(v[0])} />
      </Field>
      <Field label={`${l('max_soc')}: ${maxSoc}%`}>
        <Slider min={50} max={100} step={5} value={[maxSoc]} onValueChange={v => setMaxSoc(v[0])} />
      </Field>
      <Field label={l('full_charge_freq')}>
        <RadioGroup value={fullChargeFreq} onChange={setFullChargeFreq} options={[
          { value: 'never', label: l('never') },
          { value: 'monthly', label: l('monthly') },
          { value: 'weekly', label: l('weekly') },
          { value: 'daily', label: l('daily') },
        ]} />
      </Field>
      <Field label={l('dc_freq')}>
        <RadioGroup value={dcFreq} onChange={setDcFreq} options={[
          { value: 'never', label: l('never') },
          { value: 'occasionally', label: l('occasionally') },
          { value: 'regularly', label: l('regularly') },
          { value: 'mostly_dc', label: l('mostly_dc') },
        ]} />
      </Field>
      <Field label={l('dc_power')}>
        <Input type="number" value={dcPower || ''} onChange={e => setDcPower(Number(e.target.value))} />
      </Field>
      <Field label={l('charge_cycles')}>
        <Input type="number" placeholder="500" value={chargeCycles ?? ''} onChange={e => setChargeCycles(e.target.value ? Number(e.target.value) : undefined)} />
      </Field>
    </>
  );
}

function Step4Usage({ l, usageType, setUsageType, dailyKm, setDailyKm, loadType, setLoadType, climate, setClimate, thermalMgmt, setThermalMgmt }: any) {
  return (
    <>
      <Field label={l('usage_type')}>
        <RadioGroup value={usageType} onChange={setUsageType} options={[
          { value: 'city', label: l('city') },
          { value: 'mixed', label: l('mixed') },
          { value: 'highway', label: l('highway') },
        ]} />
      </Field>
      <Field label={l('daily_km')}>
        <Input type="number" value={dailyKm || ''} onChange={e => setDailyKm(Number(e.target.value))} />
      </Field>
      <Field label={l('load')}>
        <RadioGroup value={loadType} onChange={setLoadType} options={[
          { value: 'driver_only', label: l('driver_only') },
          { value: 'passengers', label: l('passengers') },
          { value: 'towing', label: l('towing') },
        ]} />
      </Field>
      <Field label={l('climate')}>
        <RadioGroup value={climate} onChange={setClimate} options={[
          { value: 'cold', label: l('cold') },
          { value: 'moderate', label: l('moderate') },
          { value: 'hot', label: l('hot') },
        ]} />
      </Field>
      <Field label={l('thermal_mgmt')}>
        <RadioGroup value={thermalMgmt} onChange={setThermalMgmt} options={[
          { value: 'yes', label: l('yes') },
          { value: 'no', label: l('no') },
          { value: 'partly', label: l('partly') },
        ]} />
      </Field>
    </>
  );
}

function Step5Regional({ l, country, setCountry, urbanUsage, setUrbanUsage, accident, setAccident, warrantyActive, setWarrantyActive, batteryReplaced, setBatteryReplaced }: any) {
  return (
    <>
      <Field label={l('country')}>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {['HU', 'AT', 'DE', 'CZ', 'PL', 'SK', 'RO'].map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
            <SelectItem value="other_eu">{l('other_eu')}</SelectItem>
            <SelectItem value="other">{l('other')}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label={l('urban')}>
        <RadioGroup value={urbanUsage} onChange={setUrbanUsage} options={[
          { value: 'yes', label: l('yes') },
          { value: 'mixed', label: l('mixed') },
          { value: 'rural', label: l('rural') },
        ]} />
      </Field>
      <Field label={l('accident')}>
        <RadioGroup value={accident} onChange={setAccident} options={[
          { value: 'none', label: l('none') },
          { value: 'minor', label: l('minor') },
          { value: 'battery_damage', label: l('battery_damage') },
        ]} />
      </Field>
      <Field label={l('warranty_active')}>
        <RadioGroup value={warrantyActive} onChange={setWarrantyActive} options={[
          { value: 'yes', label: l('yes') },
          { value: 'expired', label: l('expired') },
          { value: 'unknown', label: l('unknown') },
        ]} />
      </Field>
      <Field label={l('battery_replaced')}>
        <RadioGroup value={batteryReplaced} onChange={setBatteryReplaced} options={[
          { value: 'no', label: l('no') },
          { value: 'factory', label: l('factory') },
          { value: 'authorized', label: l('authorized') },
          { value: 'third_party', label: l('third_party') },
        ]} />
      </Field>
    </>
  );
}

function Step6ICE({ l, pt, lastOilKm, setLastOilKm, timingState, setTimingState, dtcRecent, setDtcRecent, fuelConsumption, setFuelConsumption, transmissionFault, setTransmissionFault, phevMode, setPhevMode }: any) {
  return (
    <>
      <Field label={l('last_oil')}>
        <Input type="number" placeholder="15000" value={lastOilKm || ''} onChange={e => setLastOilKm(Number(e.target.value))} />
      </Field>
      <Field label={l('timing')}>
        <RadioGroup value={timingState} onChange={setTimingState} options={[
          { value: 'fresh', label: l('fresh') },
          { value: 'older', label: l('older') },
          { value: 'unknown', label: l('unknown') },
        ]} />
      </Field>
      <Field label={l('dtc_recent')}>
        <RadioGroup value={dtcRecent} onChange={setDtcRecent} options={[
          { value: 'no', label: l('no') },
          { value: 'minor', label: l('minor_dtc') },
          { value: 'major', label: l('major_dtc') },
        ]} />
      </Field>
      <Field label={l('fuel_consumption')}>
        <Input type="number" step={0.1} placeholder="6.5" value={fuelConsumption || ''} onChange={e => setFuelConsumption(Number(e.target.value))} />
      </Field>
      <Field label={l('transmission_fault')}>
        <RadioGroup value={transmissionFault} onChange={setTransmissionFault} options={[
          { value: 'no', label: l('no') },
          { value: 'yes', label: l('yes') },
        ]} />
      </Field>
      {pt === 'PHEV' && (
        <Field label={l('phev_mode')}>
          <RadioGroup value={phevMode} onChange={setPhevMode} options={[
            { value: 'mostly_ev', label: l('mostly_ev') },
            { value: 'mixed', label: l('mixed') },
            { value: 'mostly_ice', label: l('mostly_ice') },
          ]} />
        </Field>
      )}
    </>
  );
}

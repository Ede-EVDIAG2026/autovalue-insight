import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { evaluationHubI18n, type HubLang } from '@/i18n/evaluationHub.i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, Loader2, Circle, FileText, Microscope } from 'lucide-react';

interface CommercialValuationWizardProps {
  vinResult: {
    vin: string;
    make: string;
    model: string;
    year: number;
    powertrain_type: string;
    body_type?: string;
    trim?: string;
    isManual?: boolean;
  };
  onBack: () => void;
}

type AgentStatus = 'idle' | 'running' | 'done' | 'error';

const COUNTRIES = ["HU","DE","AT","CZ","PL","SK","RO","FR","IT","NL","BE","ES"];
const FLAGS: Record<string, string> = { HU:'🇭🇺',DE:'🇩🇪',AT:'🇦🇹',FR:'🇫🇷',IT:'🇮🇹',ES:'🇪🇸',PL:'🇵🇱',CZ:'🇨🇿',SK:'🇸🇰',RO:'🇷🇴',NL:'🇳🇱',BE:'🇧🇪' };

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => currentYear - i);

const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Kombi', 'Coupe', 'Cabrio', 'Van', 'Pickup'] as const;
type BodyTypeKey = 'bodyTypeSedan' | 'bodyTypeHatchback' | 'bodyTypeSUV' | 'bodyTypeKombi' | 'bodyTypeCoupe' | 'bodyTypeCabrio' | 'bodyTypeVan' | 'bodyTypePickup';
const BODY_TYPE_I18N_MAP: Record<string, BodyTypeKey> = {
  Sedan: 'bodyTypeSedan',
  Hatchback: 'bodyTypeHatchback',
  SUV: 'bodyTypeSUV',
  Kombi: 'bodyTypeKombi',
  Coupe: 'bodyTypeCoupe',
  Cabrio: 'bodyTypeCabrio',
  Van: 'bodyTypeVan',
  Pickup: 'bodyTypePickup',
};

const MAKES = [
  "Alfa Romeo", "Audi", "BMW", "BYD", "Citroen", "Cupra", "Dacia",
  "DS", "Fiat", "Ford", "Honda", "Hyundai", "Jaguar", "Jeep", "Kia",
  "Land Rover", "Lexus", "Mazda", "Mercedes", "MG", "Mini", "Mitsubishi",
  "NIO", "Nissan", "Opel", "Peugeot", "Polestar", "Porsche", "Renault",
  "Seat", "Skoda", "Smart", "Subaru", "Tesla", "Toyota", "Volkswagen",
  "Volvo", "XPENG", "Egyéb"
];

const MODELS_BY_MAKE: Record<string, string[]> = {
  "Alfa Romeo": ["Tonale PHEV", "Stelvio", "Giulia", "MiTo", "Egyéb"],
  "Audi": ["A3 TFSI e", "A4", "A6 TFSI e", "A7", "A8", "e-tron", "e-tron GT", "Q3 TFSI e", "Q4 e-tron", "Q5 TFSI e", "Q7 TFSI e", "Q8 e-tron", "Egyéb"],
  "BMW": ["i3", "i4", "i5", "i7", "iX", "iX1", "iX2", "iX3", "225e", "230e", "330e", "530e", "550e", "740e", "750e", "X1 xDrive25e", "X2 xDrive25e", "X3 xDrive30e", "X5 xDrive45e", "X5 xDrive50e", "Egyéb"],
  "BYD": ["Atto 3", "Han", "Seal", "Dolphin", "Tang", "Egyéb"],
  "Citroen": ["e-C4", "e-Berlingo", "e-Dispatch", "C5 Aircross PHEV", "Egyéb"],
  "Cupra": ["Born", "Formentor e-Hybrid", "Leon e-Hybrid", "Tavascan", "Egyéb"],
  "Dacia": ["Spring", "Jogger Hybrid", "Egyéb"],
  "DS": ["DS 3 E-Tense", "DS 4 E-Tense", "DS 7 E-Tense", "Egyéb"],
  "Fiat": ["500e", "500 Hybrid", "Egyéb"],
  "Ford": ["Mustang Mach-E", "Explorer EV", "Kuga PHEV", "Puma Hybrid", "Transit Custom PHEV", "Egyéb"],
  "Honda": ["e", "HR-V e:HEV", "Jazz e:HEV", "CR-V e:PHEV", "Egyéb"],
  "Hyundai": ["IONIQ 5", "IONIQ 5 N", "IONIQ 6", "Kona Electric", "Casper Electric", "Santa Fe PHEV", "Tucson PHEV", "i30 HEV", "Egyéb"],
  "Jaguar": ["I-PACE", "F-PACE PHEV", "E-PACE PHEV", "Egyéb"],
  "Jeep": ["Avenger", "Renegade 4xe", "Compass 4xe", "Wrangler 4xe", "Egyéb"],
  "Kia": ["EV3", "EV6", "EV6 GT", "EV9", "Niro EV", "Niro PHEV", "Niro HEV", "Sportage PHEV", "Sorento PHEV", "Egyéb"],
  "Land Rover": ["Range Rover PHEV", "Range Rover Sport PHEV", "Defender PHEV", "Discovery Sport PHEV", "Egyéb"],
  "Lexus": ["UX 300e", "NX PHEV", "RX PHEV", "ES HEV", "IS HEV", "Egyéb"],
  "Mazda": ["MX-30", "CX-60 PHEV", "CX-5 MHEV", "Egyéb"],
  "Mercedes": ["EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV", "A 250 e", "C 300 e", "E 300 e", "S 580 e", "GLA 250 e", "GLB 250 e", "GLC 300 e", "GLE 350 de", "Egyéb"],
  "MG": ["MG4", "MG5", "ZS EV", "HS PHEV", "Egyéb"],
  "Mini": ["Cooper SE", "Countryman PHEV", "Aceman E", "Egyéb"],
  "Mitsubishi": ["Eclipse Cross PHEV", "Outlander PHEV", "Egyéb"],
  "NIO": ["ET5", "ET7", "EL6", "ES8", "Egyéb"],
  "Nissan": ["Leaf", "Ariya", "Qashqai MHEV", "Egyéb"],
  "Opel": ["Corsa-e", "Mokka-e", "Astra-e", "Astra PHEV", "Grandland PHEV", "Vivaro-e", "Egyéb"],
  "Peugeot": ["e-208", "e-2008", "e-308", "e-408", "e-Rifter", "3008 PHEV", "408 PHEV", "508 PHEV", "Egyéb"],
  "Polestar": ["Polestar 2", "Polestar 3", "Polestar 4", "Egyéb"],
  "Porsche": ["Taycan", "Taycan Cross Turismo", "Cayenne E-Hybrid", "Panamera E-Hybrid", "Egyéb"],
  "Renault": ["Zoe", "Megane E-Tech", "Scenic E-Tech", "Kangoo E-Tech", "Austral E-Tech PHEV", "Clio E-Tech HEV", "Egyéb"],
  "Seat": ["Leon e-Hybrid", "Tarraco e-Hybrid", "Egyéb"],
  "Skoda": ["Enyaq iV", "Enyaq Coupe iV", "Elroq", "Octavia iV", "Superb iV", "Egyéb"],
  "Smart": ["#1", "#3", "Egyéb"],
  "Subaru": ["Solterra", "Egyéb"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Egyéb"],
  "Toyota": ["bZ4X", "Yaris HEV", "Corolla HEV", "C-HR HEV", "RAV4 HEV", "RAV4 PHEV", "Highlander HEV", "Prius HEV", "Prius PHEV", "Egyéb"],
  "Volkswagen": ["ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Golf GTE", "Passat GTE", "Tiguan eHybrid", "Egyéb"],
  "Volvo": ["XC40 Recharge", "C40 Recharge", "EX30", "EX40", "EC40", "XC60 PHEV", "XC90 PHEV", "Egyéb"],
  "XPENG": ["G6", "G9", "P7", "Egyéb"],
  "Egyéb": ["Egyéb"]
};

export default function CommercialValuationWizard({ vinResult, onBack }: CommercialValuationWizardProps) {
  const { lang } = useLanguage();
  const t = evaluationHubI18n[(lang as HubLang) || 'hu'] || evaluationHubI18n.hu;
  const navigate = useNavigate();
  const isManual = !!vinResult.isManual;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  // Resolve initial make/model from VIN
  const resolvedMake = vinResult.make
    ? (MAKES.includes(vinResult.make) ? vinResult.make : 'Egyéb')
    : '';
  const resolvedModel = vinResult.model
    ? (resolvedMake && resolvedMake !== 'Egyéb' && MODELS_BY_MAKE[resolvedMake]?.includes(vinResult.model)
      ? vinResult.model
      : 'Egyéb')
    : '';

  const [formData, setFormData] = useState({
    make: resolvedMake,
    model: resolvedModel,
    customMake: resolvedMake === 'Egyéb' && vinResult.make ? vinResult.make : '',
    customModel: (resolvedModel === 'Egyéb' || resolvedMake === 'Egyéb') && vinResult.model ? vinResult.model : '',
    year: vinResult.year,
    powertrain: vinResult.powertrain_type,
    bodyType: vinResult.body_type || '',
    mileage: '',
    firstReg: '',
    owners: '1',
    serviceHistory: 'full',
    purpose: 'sell',
    country: 'HU',
    expectedPrice: '',
  });
  const [agents, setAgents] = useState<Record<number, AgentStatus>>({
    1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle',
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const updateForm = (key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleMakeChange = (v: string) => {
    setFormData(prev => ({ ...prev, make: v, model: '', customMake: '', customModel: '' }));
  };

  const handleModelChange = (v: string) => {
    setFormData(prev => ({ ...prev, model: v, customModel: '' }));
  };

  // Effective make/model for API calls
  const effectiveMake = formData.make === 'Egyéb' ? formData.customMake : formData.make;
  const effectiveModel = formData.model === 'Egyéb' || formData.make === 'Egyéb' ? formData.customModel : formData.model;

  const setAgent = (id: number, status: AgentStatus) => {
    setAgents(prev => ({ ...prev, [id]: status }));
  };

  const fetchValuation = useCallback(async (params: Record<string, string>) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://46.224.176.213:8890';
      const qs = new URLSearchParams(params);
      const res = await fetch(`${API_BASE}/market/valuation?${qs}`, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const handleStep1Next = useCallback(async () => {
    setCurrentStep(2);
    setAgent(1, 'running');
    setTimeout(() => setAgent(1, 'done'), 500);
    setAgent(2, 'running');
    const params: Record<string, string> = {
      make: effectiveMake,
      model: effectiveModel,
    };
    if (formData.year) params.year = String(formData.year);
    if (formData.powertrain) params.powertrain = formData.powertrain;
    if (formData.country) params.country = formData.country;
    const result = await fetchValuation(params);
    if (result) setAnalysisResult(result);
    setAgent(2, 'done');
  }, [formData, effectiveMake, effectiveModel, fetchValuation]);

  const handleStep2Next = useCallback(async () => {
    setCurrentStep(3);
    setAgent(3, 'running');
    const params: Record<string, string> = {
      make: effectiveMake,
      model: effectiveModel,
    };
    if (formData.year) params.year = String(formData.year);
    if (formData.powertrain) params.powertrain = formData.powertrain;
    if (formData.mileage) params.mileage_km = formData.mileage;
    if (formData.country) params.country = formData.country;
    const result = await fetchValuation(params);
    if (result) setAnalysisResult(result);
    setAgent(3, 'done');
  }, [formData, effectiveMake, effectiveModel, fetchValuation]);

  const handleStep3Start = useCallback(async () => {
    setCurrentStep(4);
    setAgent(4, 'running');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://46.224.176.213:8890';
      if (vinResult.vin && vinResult.vin.length >= 11) {
        const res = await fetch(`${API_BASE}/vin/report/${vinResult.vin}`, {
          signal: AbortSignal.timeout(15000),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysisResult((prev: any) => ({ ...prev, vinReport: data }));
        }
      }
    } catch {}
    setAgent(4, 'done');

    setAgent(5, 'running');
    await new Promise(r => setTimeout(r, 1200));
    setAgent(5, 'done');
  }, [vinResult.vin]);

  const handlePdfDownload = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://46.224.176.213:8890';
      const currentLanguage = (lang ?? 'hu').toLowerCase();

      if (vinResult.vin && vinResult.vin.length >= 11 && !vinResult.isManual) {
        // VIN-alapú PDF — JSON válasz download_url-lel
        const resp = await fetch(`${API_BASE}/vin/report/${vinResult.vin}?lang=${currentLanguage}`);
        const data = await resp.json();
        if (data.download_url) {
          window.open(data.download_url, '_blank');
        } else {
          throw new Error('No download_url');
        }
      } else {
        // VIN nélküli PDF — wizard adatokból generál, közvetlen binary stream
        const resp = await fetch(`${API_BASE}/autovalue/pdf/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            make: formData.make,
            model: formData.model,
            year: formData.year,
            powertrain: formData.powertrain,
            body_type: formData.bodyType ?? '',
            mileage_km: formData.mileage ?? 0,
            country: formData.country ?? 'HU',
            lang: currentLanguage,
            market_data: {
              p50_eur: analysisResult?.p50_eur ?? analysisResult?.median_price_eur ?? 0,
              p25_eur: analysisResult?.p25_eur ?? 0,
              p75_eur: analysisResult?.p75_eur ?? 0,
              p10_eur: analysisResult?.p10_eur ?? 0,
              p90_eur: analysisResult?.p90_eur ?? 0,
              avg_price_eur: analysisResult?.avg_price_eur ?? 0,
              min_price_eur: analysisResult?.min_price_eur ?? 0,
              max_price_eur: analysisResult?.max_price_eur ?? 0,
              listing_count: analysisResult?.listing_count ?? 0,
              avg_mileage_km: analysisResult?.avg_mileage_km ?? 0,
              comparable_listings: analysisResult?.comparable_listings ?? [],
            }
          })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeMake = (formData.make ?? 'evdiag').replace(/\s+/g, '_');
        const safeModel = (formData.model ?? 'report').replace(/\s+/g, '_');
        a.download = `EV_DIAG_${safeMake}_${safeModel}_${currentLanguage}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('PDF error:', e);
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [vinResult, lang, formData, analysisResult]);

  const agentsDone = Object.values(agents).filter(s => s === 'done').length;
  const allAgentsDone = agentsDone === 5;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </button>
        {currentStep < 4 && (
          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{currentStep} / 3</span>
            <Progress value={(currentStep / 3) * 100} className="h-2 flex-1 max-w-xs" />
            <span className="text-xs text-muted-foreground">
              {currentStep === 1 ? t.step1Title : currentStep === 2 ? t.step2Title : t.step3Title}
            </span>
          </div>
        )}
        {currentStep === 4 && (
          <span className="text-sm font-medium text-muted-foreground">{t.step4Title}</span>
        )}
      </div>

      {/* Step 1: Vehicle Identification */}
      {currentStep === 1 && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">{t.step1Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{(t as any).makeLabel ?? t.make}</Label>
                <div className="relative">
                  <Select value={formData.make} onValueChange={handleMakeChange}>
                    <SelectTrigger className={!isManual && formData.make ? 'pr-16' : ''}>
                      <SelectValue placeholder={t.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {MAKES.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isManual && formData.make && <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200 z-10">✓ VIN</Badge>}
                </div>
                {formData.make === 'Egyéb' && (
                  <Input
                    className="mt-2"
                    placeholder={(t as any).otherModel ?? 'Gyártó megadása'}
                    value={formData.customMake}
                    onChange={e => updateForm('customMake', e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label className="text-sm">{(t as any).modelLabel ?? t.model}</Label>
                <div className="relative">
                  {formData.make === 'Egyéb' ? (
                    <Input
                      value={formData.customModel}
                      onChange={e => updateForm('customModel', e.target.value)}
                      placeholder={(t as any).otherModel ?? 'Modell megadása'}
                    />
                  ) : (
                    <Select value={formData.model} onValueChange={handleModelChange} disabled={!formData.make}>
                      <SelectTrigger className={!isManual && formData.model ? 'pr-16' : ''}>
                        <SelectValue placeholder={!formData.make ? (t as any).selectMakeFirst ?? 'Először válassz gyártót' : t.selectPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {(MODELS_BY_MAKE[formData.make] || []).map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!isManual && formData.model && formData.make !== 'Egyéb' && <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200 z-10">✓ VIN</Badge>}
                </div>
                {formData.model === 'Egyéb' && formData.make !== 'Egyéb' && (
                  <Input
                    className="mt-2"
                    placeholder={(t as any).otherModel ?? 'Modell megadása'}
                    value={formData.customModel}
                    onChange={e => updateForm('customModel', e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label className="text-sm">{t.year}</Label>
                <div className="relative">
                  <Select value={String(formData.year)} onValueChange={v => updateForm('year', Number(v))}>
                    <SelectTrigger className={isManual ? '' : 'pr-16'}>
                      <SelectValue placeholder={t.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isManual && <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200 z-10">✓ VIN</Badge>}
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.powertrain}</Label>
                <Select value={formData.powertrain} onValueChange={v => updateForm('powertrain', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEV">BEV</SelectItem>
                    <SelectItem value="PHEV">PHEV</SelectItem>
                    <SelectItem value="HEV">HEV</SelectItem>
                    <SelectItem value="MHEV">MHEV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm">{t.bodyType}</Label>
                <Select value={formData.bodyType} onValueChange={v => updateForm('bodyType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map(bt => (
                      <SelectItem key={bt} value={bt}>
                        {(t as any)[BODY_TYPE_I18N_MAP[bt]] ?? bt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleStep1Next}>
              {t.next}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Vehicle Condition */}
      {currentStep === 2 && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">{t.step2Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">{t.mileage}</Label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={e => updateForm('mileage', e.target.value)}
                placeholder="80000"
              />
            </div>
            <div>
              <Label className="text-sm">{t.firstReg}</Label>
              <Input
                type="date"
                value={formData.firstReg}
                onChange={e => updateForm('firstReg', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">{t.owners}</Label>
              <Select value={formData.owners} onValueChange={v => updateForm('owners', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t.owners_1}</SelectItem>
                  <SelectItem value="2">{t.owners_2}</SelectItem>
                  <SelectItem value="3+">{t.owners_3plus}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">{t.serviceHistory}</Label>
              <Select value={formData.serviceHistory} onValueChange={v => updateForm('serviceHistory', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">{t.serviceHistory_full}</SelectItem>
                  <SelectItem value="partial">{t.serviceHistory_partial}</SelectItem>
                  <SelectItem value="none">{t.serviceHistory_none}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                {t.back}
              </Button>
              <Button className="flex-1" onClick={handleStep2Next} disabled={!formData.mileage}>
                {t.next}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Market Context */}
      {currentStep === 3 && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">{t.step3Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">{t.evaluationPurpose}</Label>
              <Select value={formData.purpose} onValueChange={v => updateForm('purpose', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell">{t.purpose_sell}</SelectItem>
                  <SelectItem value="buy">{t.purpose_buy}</SelectItem>
                  <SelectItem value="trade">{t.purpose_trade}</SelectItem>
                  <SelectItem value="insurance">{t.purpose_insurance}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">{t.country}</Label>
              <Select value={formData.country} onValueChange={v => updateForm('country', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{FLAGS[c] || ''} {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">{t.expectedPrice}</Label>
              <Input
                type="number"
                value={formData.expectedPrice}
                onChange={e => updateForm('expectedPrice', e.target.value)}
                placeholder="pl. 25 000"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                {t.back}
              </Button>
              <Button className="flex-1" onClick={handleStep3Start}>
                {t.startAnalysis}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Agent Progress & Results */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card className="border border-border">
            <CardContent className="pt-5 space-y-3">
              {[
                { id: 1, label: t.agent1 },
                { id: 2, label: t.agent2 },
                { id: 3, label: t.agent3 },
                { id: 4, label: t.agent4 },
                { id: 5, label: t.agent5 },
              ].map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  {agents[a.id] === 'done' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : agents[a.id] === 'running' ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                  <span className={`text-sm ${agents[a.id] === 'done' ? 'text-foreground font-medium' : agents[a.id] === 'running' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {a.label}
                  </span>
                  {agents[a.id] === 'done' && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">{t.agentDone}</Badge>
                  )}
                </div>
              ))}
              <Progress value={(agentsDone / 5) * 100} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground text-center">
                {agentsDone} / 5 {allAgentsDone ? t.agentDone : t.analysisRunning}
              </p>
            </CardContent>
          </Card>

          {allAgentsDone && analysisResult && (
            <Card className="border border-border">
              <CardContent className="pt-5 space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {effectiveMake} {effectiveModel} ({formData.year})
                  </h3>
                  {analysisResult.p50_eur != null && (
                    <div className="text-3xl font-bold text-primary">
                      €{Number(analysisResult.p50_eur).toLocaleString()}
                    </div>
                  )}
                  {(analysisResult.p25_eur != null || analysisResult.p75_eur != null) && (
                    <p className="text-sm text-muted-foreground">
                      P25: €{Number(analysisResult.p25_eur ?? 0).toLocaleString()} — P75: €{Number(analysisResult.p75_eur ?? 0).toLocaleString()}
                    </p>
                  )}
                  {analysisResult.listing_count != null && (
                    <Badge variant="secondary">{analysisResult.listing_count} listings</Badge>
                  )}
                  {analysisResult.avg_mileage_km != null && (
                    <p className="text-xs text-muted-foreground">
                      Ø {Number(analysisResult.avg_mileage_km).toLocaleString()} km
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    variant={pdfError ? 'destructive' : 'outline'}
                    disabled={pdfLoading}
                    onClick={handlePdfDownload}
                  >
                    {pdfLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.pdfLoading}</>
                    ) : pdfError ? (
                      <><span className="mr-2">⚠</span>{t.pdfError}</>
                    ) : (
                      <><FileText className="h-4 w-4 mr-2" />{t.pdfBtn}</>
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate(`/ev-database?make=${encodeURIComponent(formData.make)}&model=${encodeURIComponent(formData.model)}&autoopen=true&action=inspection`)}
                  >
                    <Microscope className="h-4 w-4 mr-2" />
                    🔬 Pre-Inspection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

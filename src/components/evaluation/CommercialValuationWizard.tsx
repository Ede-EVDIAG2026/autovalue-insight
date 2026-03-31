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

export default function CommercialValuationWizard({ vinResult, onBack }: CommercialValuationWizardProps) {
  const { lang } = useLanguage();
  const t = evaluationHubI18n[(lang as HubLang) || 'hu'] || evaluationHubI18n.hu;
  const navigate = useNavigate();
  const isManual = !!vinResult.isManual;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    make: vinResult.make,
    model: vinResult.model,
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
      make: formData.make,
      model: formData.model,
    };
    if (formData.year) params.year = String(formData.year);
    if (formData.powertrain) params.powertrain = formData.powertrain;
    if (formData.country) params.country = formData.country;
    const result = await fetchValuation(params);
    if (result) setAnalysisResult(result);
    setAgent(2, 'done');
  }, [formData, fetchValuation]);

  const handleStep2Next = useCallback(async () => {
    setCurrentStep(3);
    setAgent(3, 'running');
    const params: Record<string, string> = {
      make: formData.make,
      model: formData.model,
    };
    if (formData.year) params.year = String(formData.year);
    if (formData.powertrain) params.powertrain = formData.powertrain;
    if (formData.mileage) params.mileage_km = formData.mileage;
    if (formData.country) params.country = formData.country;
    const result = await fetchValuation(params);
    if (result) setAnalysisResult(result);
    setAgent(3, 'done');
  }, [formData, fetchValuation]);

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
      const pdfLang = (lang ?? 'hu').toLowerCase();

      if (vinResult.vin && vinResult.vin.length >= 11) {
        const resp = await fetch(`${API_BASE}/vin/report/${vinResult.vin}?lang=${pdfLang}`, {
          signal: AbortSignal.timeout(20000),
          headers: { Accept: 'application/json' },
        });
        const data = await resp.json();
        if (data.download_url) {
          window.open(data.download_url, '_blank');
        } else {
          throw new Error('No download_url');
        }
      } else {
        const resp = await fetch(`${API_BASE}/autovalue/pdf/report?lang=${pdfLang}`, {
          signal: AbortSignal.timeout(20000),
        });
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evdiag_report_${pdfLang}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [vinResult.vin, lang]);

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
                <Label className="text-sm">{t.make}</Label>
                <div className="relative">
                  <Input
                    value={formData.make}
                    onChange={e => updateForm('make', e.target.value)}
                    className={isManual ? '' : 'pr-16'}
                  />
                  {!isManual && <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200">✓ VIN</Badge>}
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.model}</Label>
                <div className="relative">
                  <Input
                    value={formData.model}
                    onChange={e => updateForm('model', e.target.value)}
                    className={isManual ? '' : 'pr-16'}
                  />
                  {!isManual && <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200">✓ VIN</Badge>}
                </div>
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
                    {formData.make} {formData.model} ({formData.year})
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

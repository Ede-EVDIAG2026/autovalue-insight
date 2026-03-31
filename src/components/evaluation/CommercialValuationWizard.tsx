import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { evaluationHubI18n, type HubLang } from '@/i18n/evaluationHub.i18n';
import { MARKET_API } from '@/lib/marketApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, Loader2, Circle, ShoppingCart, CreditCard, ArrowRightLeft, Shield, FileText, Microscope } from 'lucide-react';

interface CommercialValuationWizardProps {
  vinResult: {
    vin: string;
    make: string;
    model: string;
    year: number;
    powertrain_type: string;
    body_type?: string;
    trim?: string;
  };
  onBack: () => void;
}

type AgentStatus = 'idle' | 'running' | 'done' | 'error';

const COUNTRIES = ["HU","DE","AT","CZ","PL","SK","RO","FR","IT","NL","BE","ES"];
const FLAGS: Record<string, string> = { HU:'🇭🇺',DE:'🇩🇪',AT:'🇦🇹',FR:'🇫🇷',IT:'🇮🇹',ES:'🇪🇸',PL:'🇵🇱',CZ:'🇨🇿',SK:'🇸🇰',RO:'🇷🇴',NL:'🇳🇱',BE:'🇧🇪' };

export default function CommercialValuationWizard({ vinResult, onBack }: CommercialValuationWizardProps) {
  const { lang } = useLanguage();
  const t = evaluationHubI18n[(lang as HubLang) || 'hu'] || evaluationHubI18n.hu;
  const navigate = useNavigate();

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

  const updateForm = (key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const setAgent = (id: number, status: AgentStatus) => {
    setAgents(prev => ({ ...prev, [id]: status }));
  };

  const fetchValuation = useCallback(async (params: Record<string, string>) => {
    try {
      const qs = new URLSearchParams(params);
      const res = await fetch(`${MARKET_API}/api/v1/market/valuation?${qs}`, {
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
    // Agent 1: VIN already identified
    setAgent(1, 'running');
    setTimeout(() => setAgent(1, 'done'), 500);
    // Agent 2: Market price lookup
    setAgent(2, 'running');
    const result = await fetchValuation({
      make: formData.make,
      model: formData.model,
      year: String(formData.year),
      powertrain: formData.powertrain,
    });
    if (result) setAnalysisResult(result);
    setAgent(2, 'done');
  }, [formData, fetchValuation]);

  const handleStep2Next = useCallback(async () => {
    setCurrentStep(3);
    // Agent 3: Mileage-based correction
    setAgent(3, 'running');
    const result = await fetchValuation({
      make: formData.make,
      model: formData.model,
      year: String(formData.year),
      powertrain: formData.powertrain,
      mileage_km: formData.mileage,
    });
    if (result) setAnalysisResult(result);
    setAgent(3, 'done');
  }, [formData, fetchValuation]);

  const handleStep3Start = useCallback(async () => {
    setCurrentStep(4);
    // Agent 4: Recall check
    setAgent(4, 'running');
    try {
      const res = await fetch(`https://api.evdiag.hu/vin/report/${vinResult.vin}`, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult((prev: any) => ({ ...prev, vinReport: data }));
      }
    } catch {}
    setAgent(4, 'done');

    // Agent 5: Final summary
    setAgent(5, 'running');
    await new Promise(r => setTimeout(r, 1200));
    setAgent(5, 'done');
  }, [vinResult.vin]);

  const agentsDone = Object.values(agents).filter(s => s === 'done').length;
  const allAgentsDone = agentsDone === 5;

  const purposeCards = [
    { value: 'sell', icon: <ShoppingCart className="h-5 w-5" />, label: t.purpose_sell },
    { value: 'buy', icon: <CreditCard className="h-5 w-5" />, label: t.purpose_buy },
    { value: 'trade', icon: <ArrowRightLeft className="h-5 w-5" />, label: t.purpose_trade },
    { value: 'insurance', icon: <Shield className="h-5 w-5" />, label: t.purpose_insurance },
  ];

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
                    className="pr-16"
                  />
                  <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200">✓ VIN</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.model}</Label>
                <div className="relative">
                  <Input
                    value={formData.model}
                    onChange={e => updateForm('model', e.target.value)}
                    className="pr-16"
                  />
                  <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200">✓ VIN</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.year}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={2000}
                    max={2026}
                    value={formData.year}
                    onChange={e => updateForm('year', Number(e.target.value))}
                    className="pr-16"
                  />
                  <Badge className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 border-green-200">✓ VIN</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.powertrain}</Label>
                <Select value={formData.powertrain} onValueChange={v => updateForm('powertrain', v)}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Input
                  value={formData.bodyType}
                  onChange={e => updateForm('bodyType', e.target.value)}
                  placeholder="SUV, Sedan, Hatchback..."
                />
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
              <div className="flex gap-2 mt-1">
                {[
                  { value: '1', label: t.owners_1 },
                  { value: '2', label: t.owners_2 },
                  { value: '3+', label: t.owners_3plus },
                ].map(o => (
                  <button
                    key={o.value}
                    onClick={() => updateForm('owners', o.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      formData.owners === o.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">{t.serviceHistory}</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'full', label: t.serviceHistory_full },
                  { value: 'partial', label: t.serviceHistory_partial },
                  { value: 'none', label: t.serviceHistory_none },
                ].map(o => (
                  <button
                    key={o.value}
                    onClick={() => updateForm('serviceHistory', o.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      formData.serviceHistory === o.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                {purposeCards.map(p => (
                  <button
                    key={p.value}
                    onClick={() => updateForm('purpose', p.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.purpose === p.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">{t.country}</Label>
              <Select value={formData.country} onValueChange={v => updateForm('country', v)}>
                <SelectTrigger>
                  <SelectValue />
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
          {/* Agent status panel */}
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

          {/* Results section */}
          {allAgentsDone && analysisResult && (
            <Card className="border border-border">
              <CardContent className="pt-5 space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {formData.make} {formData.model} ({formData.year})
                  </h3>
                  {analysisResult.price_stats && (
                    <div className="text-3xl font-bold text-primary">
                      €{(analysisResult.price_stats.median_eur ?? analysisResult.price_stats.median ?? 0).toLocaleString()}
                    </div>
                  )}
                  {analysisResult.price_stats && (
                    <p className="text-sm text-muted-foreground">
                      P25: €{(analysisResult.price_stats.p25_eur ?? analysisResult.price_stats.p25 ?? 0).toLocaleString()} — P75: €{(analysisResult.price_stats.p75_eur ?? analysisResult.price_stats.p75 ?? 0).toLocaleString()}
                    </p>
                  )}
                  {analysisResult.data_points != null && (
                    <Badge variant="secondary">{analysisResult.data_points} listings</Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t.downloadPdf}
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

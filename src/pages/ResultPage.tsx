import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, TrendingDown, Minus, Shield, Gauge, Clock, 
  BarChart3, Handshake, Store, Droplets, CalendarClock, 
  Camera, Share2, ArrowRight, RefreshCw, Upload, Info, FileText, Percent
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { calculateConfidence } from '@/utils/confidenceScoring';

const formatHuf = (v: number) => v ? `${Math.round(v).toLocaleString('hu-HU')} Ft` : '–';
const formatEur = (v: number) => v ? `€${Math.round(v).toLocaleString('de-DE')}` : '–';

const ResultPage = () => {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { result, vehicleData } = (location.state as any) || {};
  const [photos, setPhotos] = useState<Record<string, File | null>>({
    front: null, rear: null, side: null, interior: null, damage: null,
  });
  const [photoCount, setPhotoCount] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const valuationTime = useMemo(() => new Date().toLocaleString('hu-HU'), []);

  if (!result || !vehicleData) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">Nincs elérhető eredmény.</p>
          <Button onClick={() => navigate('/valuation')}>{tr('new_valuation')}</Button>
        </div>
      </div>
    );
  }

  // Extract values
  const bayesian = result?.bayesian || result || {};
  const negotiation = result?.negotiation || {};
  const dealer = result?.dealer || {};
  const velocity = result?.velocity || {};
  const market = result?.market || {};

  const p10 = bayesian.final_p10_huf || bayesian.p10_huf || 0;
  const p50 = bayesian.final_p50_huf || bayesian.p50_huf || 0;
  const p90 = bayesian.final_p90_huf || bayesian.p90_huf || 0;
  const p50Eur = bayesian.final_p50_eur || bayesian.p50_eur || 0;
  const recommendedAsk = bayesian.recommended_ask_huf || p50;
  const negotiationFloor = bayesian.negotiation_floor_huf || p10;
  const dealerPrice = dealer.recommended_listing_price_huf || Math.round(p50 * 1.08);
  const velocityDays = velocity.velocity_at_recommended_ask_days || 28;
  const liquidityLevel = market.market_depth || 'normal';
  const resale3y = Math.round(p50 * 0.72);
  const depreciation3y = 28; // placeholder: ~28% over 3 years
  const negotiationMargin = recommendedAsk - negotiationFloor;

  // Confidence scoring via utility
  const confidenceResult = useMemo(() => calculateConfidence(
    vehicleData,
    {
      backendConfidenceScore: bayesian.confidence_score || null,
      hasComparableMarketData: (market.market_depth === 'high' || market.market_depth === 'normal'),
      marketSampleCount: market.sample_count,
      photoCount,
    }
  ), [vehicleData, bayesian.confidence_score, market, photoCount]);

  const confidence = confidenceResult.confidenceScore;
  const confidenceLabel = tr(confidenceResult.confidenceLabelKey) || confidenceResult.confidenceLabel;

  const handlePhotoUpload = (slot: string) => {
    fileRefs.current[slot]?.click();
  };

  const handleFileChange = (slot: string, file: File | null) => {
    if (!file) return;
    setPhotos(prev => {
      const next = { ...prev, [slot]: file };
      setPhotoCount(Object.values(next).filter(Boolean).length);
      return next;
    });
    toast.success(`${slot} fotó feltöltve (+3% confidence)`);
  };

  const handleShareReport = () => {
    const report = `
EV DIAG AutoValue Intelligence Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${vehicleData.vehicle_make} ${vehicleData.vehicle_model} (${vehicleData.vehicle_year})
${vehicleData.vehicle_mileage_km.toLocaleString()} km

📊 Piaci érték: ${formatHuf(p50)} (${formatEur(p50Eur)})
🎯 Confidence: ${confidence}% — ${confidenceLabel}
📉 Alacsony ár: ${formatHuf(p10)}
📈 Magas ár: ${formatHuf(p90)}

🤝 Ajánlott ajánlat: ${formatHuf(negotiationFloor)}
💰 Tárgyalási mozgástér: ${formatHuf(negotiationMargin)}
🏪 Kereskedői ár: ${formatHuf(dealerPrice)}

⏱ Becsült eladási idő: ${velocityDays} nap
📊 Likviditás: ${liquidityLevel}
📅 3 éves viszonteladási érték: ${formatHuf(resale3y)}
📉 Várható értékvesztés: ${depreciation3y}%

${valuationTime}
    `.trim();

    navigator.clipboard.writeText(report);
    toast.success(tr('report_copied'));
  };

  const photoSlots = [
    { key: 'front', label: tr('photo_front'), icon: '🚗' },
    { key: 'rear', label: tr('photo_rear'), icon: '🔙' },
    { key: 'side', label: tr('photo_side'), icon: '🚙' },
    { key: 'interior', label: tr('photo_interior'), icon: '💺' },
    { key: 'damage', label: tr('photo_damage'), icon: '⚠️' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header area */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {vehicleData.vehicle_make} {vehicleData.vehicle_model} ({vehicleData.vehicle_year})
          </h1>
          <p className="text-muted-foreground">
            {vehicleData.vehicle_mileage_km.toLocaleString()} km · {vehicleData.target_country}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {tr('result_summary')} · {valuationTime}
          </p>
        </div>

        <div className="grid gap-6 animate-slide-up">
          {/* ROW 1: Main Valuation + Confidence + Price Range */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                {tr('ev_diag_market_value')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <p className="text-4xl font-display font-bold text-foreground">{formatHuf(p50)}</p>
                <p className="text-muted-foreground text-sm mt-1">{formatEur(p50Eur)}</p>
              </div>

              {/* Confidence with label + tooltip */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    {tr('confidence_score')}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">
                        {tr('confidence_explanation')}
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={confidence >= 75 ? 'default' : confidence >= 50 ? 'secondary' : 'outline'}>
                      {confidence}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">{confidenceLabel}</span>
                  </div>
                </div>
                <Progress value={confidence} className="h-2" />
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">{tr('price_range')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <TrendingDown className="h-4 w-4 text-destructive mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{tr('low_price')}</p>
                    <p className="font-semibold text-foreground text-sm">{formatHuf(p10)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Minus className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{tr('market_price')}</p>
                    <p className="font-semibold text-foreground text-sm">{formatHuf(p50)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                    <TrendingUp className="h-4 w-4 text-secondary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{tr('high_price')}</p>
                    <p className="font-semibold text-foreground text-sm">{formatHuf(p90)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROW 2: Decision Support — Negotiation + Dealer */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Handshake className="h-5 w-5 text-primary" />
                  {tr('negotiation_intelligence')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/10">
                  <p className="text-xs text-muted-foreground mb-1">{tr('recommended_offer')}</p>
                  <p className="text-xl font-display font-bold text-foreground">{formatHuf(negotiationFloor)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">{tr('negotiation_margin')}</p>
                  <p className="text-xl font-display font-bold text-foreground">{formatHuf(negotiationMargin)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5 text-primary" />
                  {tr('dealer_typical_price')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground text-sm">{tr('dealer_typical_price')}</span>
                  <span className="text-2xl font-display font-bold text-foreground">{formatHuf(dealerPrice)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ROW 3: Market Insight — Liquidity + Resale + Depreciation */}
          <div className="grid sm:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplets className="h-5 w-5 text-primary" />
                  {tr('market_liquidity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{tr('liquidity_level')}</span>
                  </div>
                  <Badge variant={liquidityLevel === 'high' ? 'default' : liquidityLevel === 'normal' ? 'secondary' : 'outline'}>
                    {liquidityLevel}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{tr('est_selling_time')}</span>
                  </div>
                  <p className="font-display font-bold text-foreground">{velocityDays} {tr('days')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  {tr('expected_resale')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{formatHuf(resale3y)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Percent className="h-5 w-5 text-primary" />
                  {tr('depreciation_3y')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10 text-center">
                  <p className="text-2xl font-display font-bold text-destructive">-{depreciation3y}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Photo Upgrade Module */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-primary" />
                {tr('photo_upgrade_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{tr('photo_upgrade_helper')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {photoSlots.map(slot => (
                  <button
                    key={slot.key}
                    onClick={() => handlePhotoUpload(slot.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all ${
                      photos[slot.key]
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <span className="text-2xl">{slot.icon}</span>
                    <span className="text-xs font-medium text-foreground">{slot.label}</span>
                    {photos[slot.key] ? (
                      <Badge variant="secondary" className="text-[10px]">✓</Badge>
                    ) : (
                      <Upload className="h-3 w-3 text-muted-foreground" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => { fileRefs.current[slot.key] = el; }}
                      onChange={e => handleFileChange(slot.key, e.target.files?.[0] || null)}
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Share / Report */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 hero-gradient" onClick={handleShareReport}>
              <Share2 className="mr-2 h-4 w-4" />
              {tr('send_to_seller')}
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <FileText className="mr-2 h-4 w-4" />
              {tr('pdf_report')}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/valuation')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {tr('new_valuation')}
            </Button>
          </div>

          {/* Dealer Funnel */}
          <Card className="glass-card border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
              <div className="text-4xl">🏪</div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display font-bold text-foreground text-lg">{tr('dealer_cta_title')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{tr('dealer_cta_desc')}</p>
              </div>
              <Button variant="outline" className="shrink-0 border-primary/20 text-primary hover:bg-primary/5" onClick={() => navigate('/portal')}>
                {tr('dealer_platform_open')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Handshake, Store, Camera, Share2, ArrowRight,
  RefreshCw, Upload, FileText, Target, TrendingUp, ShieldCheck
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { calculateConfidence } from '@/utils/confidenceScoring';
import MarketValueHero from '@/components/results/MarketValueHero';
import ConfidenceCard from '@/components/results/ConfidenceCard';
import PriceRangeCard from '@/components/results/PriceRangeCard';
import MarketInsightRow from '@/components/results/MarketInsightRow';
import ResultsStep from '@/components/autovalue/ResultsStep';

const formatHuf = (v: number) => v ? `${Math.round(v).toLocaleString('hu-HU')} Ft` : '–';
const formatEur = (v: number) => v ? `€${Math.round(v).toLocaleString('de-DE')}` : '–';

/* ─── Zone divider ─── */
const ZoneHeader = ({ icon: Icon, label, helper }: { icon: any; label: string; helper?: string }) => (
  <div className="flex items-center gap-3 pt-4 pb-1">
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-primary">{label}</h2>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
    <div className="flex-1 h-px bg-border ml-2" />
  </div>
);

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

  const bayesian = result?.bayesian || result || {};
  const dealer = result?.dealer || {};
  const velocity = result?.velocity || {};
  const market = result?.market || {};

  const confidenceResult = useMemo(() => calculateConfidence(
    vehicleData || {},
    {
      backendConfidenceScore: bayesian.confidence_score || null,
      hasComparableMarketData: (market.market_depth === 'high' || market.market_depth === 'normal'),
      marketSampleCount: market.sample_count,
      photoCount,
    }
  ), [vehicleData, bayesian.confidence_score, market, photoCount]);

  const confidence = confidenceResult.confidenceScore;
  const confidenceLabel = tr(confidenceResult.confidenceLabelKey) || confidenceResult.confidenceLabel;

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
  const depreciation3y = 28;
  const negotiationMargin = recommendedAsk - negotiationFloor;

  const handlePhotoUpload = (slot: string) => { fileRefs.current[slot]?.click(); };
  const handleFileChange = (slot: string, file: File | null) => {
    if (!file) return;
    setPhotos(prev => {
      const next = { ...prev, [slot]: file };
      setPhotoCount(Object.values(next).filter(Boolean).length);
      return next;
    });
    toast.success(`${slot} fotó feltöltve`);
  };

  const handleShareReport = () => {
    const report = `EV DIAG AutoValue Intelligence Report\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${vehicleData.vehicle_make} ${vehicleData.vehicle_model} (${vehicleData.vehicle_year})\n${vehicleData.vehicle_mileage_km.toLocaleString()} km\n\n📊 Piaci érték: ${formatHuf(p50)} (${formatEur(p50Eur)})\n🎯 Confidence: ${confidence}% — ${confidenceLabel}\n📉 Alacsony ár: ${formatHuf(p10)}\n📈 Magas ár: ${formatHuf(p90)}\n\n🤝 Ajánlott ajánlat: ${formatHuf(negotiationFloor)}\n💰 Tárgyalási mozgástér: ${formatHuf(negotiationMargin)}\n🏪 Kereskedői ár: ${formatHuf(dealerPrice)}\n\n⏱ Becsült eladási idő: ${velocityDays} nap\n📅 3 éves viszonteladási érték: ${formatHuf(resale3y)}\n📉 Várható értékvesztés: ${depreciation3y}%\n\n${valuationTime}`;
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* ─── Header ─── */}
        <div className="mb-8 animate-slide-up">
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-2">
            EV DIAG AutoValue Intelligence
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            {vehicleData.vehicle_make} {vehicleData.vehicle_model}
            <span className="text-muted-foreground font-normal ml-2 text-2xl">({vehicleData.vehicle_year})</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {vehicleData.vehicle_mileage_km.toLocaleString()} km · {vehicleData.target_country}
            <span className="mx-2">·</span>
            <span className="text-xs">{valuationTime}</span>
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════
            ZONE 1 — Core Valuation
        ═══════════════════════════════════════════════════ */}
        <div className="space-y-6 animate-slide-up">
          <ZoneHeader icon={ShieldCheck} label={tr('zone_core_valuation')} />

          <MarketValueHero
            p50={p50}
            p50Eur={p50Eur}
            confidence={confidence}
            confidenceLabel={confidenceLabel}
            title={tr('ev_diag_market_value')}
          />

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <ConfidenceCard
                confidence={confidence}
                confidenceLabel={confidenceLabel}
                title={tr('confidence_score')}
                explanation={tr('confidence_explanation')}
              />
            </div>
            <div className="lg:col-span-3">
              <PriceRangeCard
                p10={p10}
                p50={p50}
                p90={p90}
                title={tr('price_range')}
                lowLabel={tr('low_price')}
                marketLabel={tr('market_price')}
                highLabel={tr('high_price')}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              ZONE 2 — Negotiation Intelligence
          ═══════════════════════════════════════════════════ */}
          <ZoneHeader icon={Target} label={tr('zone_negotiation')} helper={tr('negotiation_helper')} />

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Recommended offer */}
            <Card className="glass-card border-l-4 border-l-secondary">
              <CardContent className="pt-5 pb-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Handshake className="h-4 w-4 text-secondary" />
                  {tr('recommended_offer')}
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{formatHuf(negotiationFloor)}</p>
                <p className="text-[11px] text-muted-foreground">Nyitóajánlat szintje vásárlóként</p>
              </CardContent>
            </Card>
            {/* Negotiation margin */}
            <Card className="glass-card border-l-4 border-l-primary">
              <CardContent className="pt-5 pb-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Handshake className="h-4 w-4 text-primary" />
                  {tr('negotiation_margin')}
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{formatHuf(negotiationMargin)}</p>
                <p className="text-[11px] text-muted-foreground">Mozgástér az ajánlott és a piaci ár között</p>
              </CardContent>
            </Card>
            {/* Dealer price */}
            <Card className="glass-card border-l-4 border-l-muted-foreground">
              <CardContent className="pt-5 pb-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  {tr('dealer_typical_price')}
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{formatHuf(dealerPrice)}</p>
                <p className="text-[11px] text-muted-foreground">Kereskedői szintű hirdetési ár</p>
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════════
              ZONE 3 — Market Intelligence
          ═══════════════════════════════════════════════════ */}
          <ZoneHeader icon={TrendingUp} label={tr('zone_market')} helper={tr('market_helper')} />

          <ResultsStep
            result={result}
            vehicleData={vehicleData}
            priceEur={bayesian.recommended_ask_eur || bayesian.p50_eur || 0}
          >
            <MarketInsightRow
              liquidityLevel={liquidityLevel}
              velocityDays={velocityDays}
              resale3y={resale3y}
              depreciation3y={depreciation3y}
              labels={{
                liquidity: tr('market_liquidity'),
                liquidityLevel: tr('liquidity_level'),
                estSellingTime: tr('est_selling_time'),
                days: tr('days'),
                resale: tr('expected_resale'),
                depreciation: tr('depreciation_3y'),
              }}
            />
          </ResultsStep>

          {/* ─── Photo upgrade ─── */}
          <Card className="glass-card">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-foreground">{tr('photo_upgrade_title')}</h3>
              </div>
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

          {/* ─── Actions ─── */}
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

          {/* ─── Dealer funnel ─── */}
          <div className="relative mt-4 rounded-2xl overflow-hidden border border-primary/15">
            <div className="absolute inset-0 hero-gradient opacity-[0.04]" />
            <div className="relative flex flex-col sm:flex-row items-center gap-8 p-8 sm:p-10">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 shrink-0">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h3 className="font-display font-bold text-foreground text-xl">Kereskedő vagy?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                  Próbáld ki az EV DIAG Dealer Platform bétát 50 ingyenes audit kredittel, és teszteld a rendszert valós piaci környezetben.
                </p>
                <p className="text-xs text-muted-foreground/70 italic">Béta hozzáférés, limitált induló időszak.</p>
              </div>
              <Button className="shrink-0 hero-gradient px-6 py-5 text-base shadow-md hover:shadow-lg transition-shadow" onClick={() => navigate('/portal')}>
                Dealer Platform megnyitása
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

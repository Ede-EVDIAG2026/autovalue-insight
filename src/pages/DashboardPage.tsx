import { useState, useCallback } from 'react';
import EUAutoValueIntelligence, { type VehicleEvaluation, type VinIdentifiedResult } from '@/components/EUAutoValueIntelligence';
import AppHeader from '@/components/AppHeader';
import MarketIntelligenceSection from '@/components/market/MarketIntelligenceSection';
import EvaluationHub from '@/components/evaluation/EvaluationHub';
import { useLanguage } from '@/i18n/LanguageContext';
import { evaluationHubI18n, type HubLang } from '@/i18n/evaluationHub.i18n';
import type { VehicleParams } from '@/hooks/useMarketIntelligence';

const DashboardPage = () => {
  const { lang } = useLanguage();
  const t = evaluationHubI18n[(lang as HubLang) || 'hu'] || evaluationHubI18n.hu;
  const [vehicle, setVehicle] = useState<VehicleParams | null>(null);
  const [vinResult, setVinResult] = useState<VinIdentifiedResult | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const handleVehicleEvaluated = useCallback((v: VehicleEvaluation) => {
    setVehicle({
      make: v.make,
      model: v.model,
      year: v.year,
      mileage: v.mileage,
      country: v.country,
    });
  }, []);

  const handleVinIdentified = useCallback((result: VinIdentifiedResult) => {
    console.log('vinResult:', result);
    setVinResult(result);
  }, []);

  const handleManualStart = () => {
    setManualMode(true);
    setVinResult({
      vin: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      powertrain_type: 'BEV',
      body_type: '',
      trim: '',
      isManual: true,
    } as any);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 space-y-8">
        {vinResult && (vinResult.make || manualMode) ? (
          <EvaluationHub vinResult={vinResult as any} />
        ) : (
          <div>
            <EUAutoValueIntelligence
              onVehicleEvaluated={handleVehicleEvaluated}
              onVinIdentified={handleVinIdentified}
            />
            <div className="text-center mt-3">
              <button
                onClick={handleManualStart}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                {t.noVin} <span className="font-medium text-primary">{t.manualStart}</span>
              </button>
            </div>
          </div>
        )}
        <MarketIntelligenceSection vehicle={vehicle} />
      </div>
    </div>
  );
};

export default DashboardPage;

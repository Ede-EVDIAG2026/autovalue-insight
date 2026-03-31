import { useState, useCallback } from 'react';
import EUAutoValueIntelligence, { type VehicleEvaluation, type VinIdentifiedResult } from '@/components/EUAutoValueIntelligence';
import AppHeader from '@/components/AppHeader';
import MarketIntelligenceSection from '@/components/market/MarketIntelligenceSection';
import EvaluationHub from '@/components/evaluation/EvaluationHub';
import type { VehicleParams } from '@/hooks/useMarketIntelligence';

const DashboardPage = () => {
  const [vehicle, setVehicle] = useState<VehicleParams | null>(null);
  const [vinResult, setVinResult] = useState<VinIdentifiedResult | null>(null);

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
    setVinResult(result);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 space-y-8">
        {vinResult && vinResult.make ? (
          <EvaluationHub vinResult={vinResult} />
        ) : (
          <EUAutoValueIntelligence
            onVehicleEvaluated={handleVehicleEvaluated}
            onVinIdentified={handleVinIdentified}
          />
        )}
        <MarketIntelligenceSection vehicle={vehicle} />
      </div>
    </div>
  );
};

export default DashboardPage;

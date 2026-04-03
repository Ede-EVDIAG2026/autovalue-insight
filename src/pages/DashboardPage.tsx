import { useState, useCallback } from 'react';
import EUAutoValueIntelligence, { type VehicleEvaluation, type VinIdentifiedResult } from '@/components/EUAutoValueIntelligence';
import AppHeader from '@/components/AppHeader';
import MarketIntelligenceSection from '@/components/market/MarketIntelligenceSection';
import EvaluationHub from '@/components/evaluation/EvaluationHub';
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardServiceCards from '@/components/dashboard/DashboardServiceCards';
import DashboardFooter from '@/components/dashboard/DashboardFooter';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

import type { VehicleParams } from '@/hooks/useMarketIntelligence';

type DashboardTab = 'home' | 'valuation' | 'evdb';

const DashboardPage = () => {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
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
    setActiveTab('valuation');
  };

  const handleVinFlow = () => {
    setActiveTab('valuation');
  };

  const handleCommercial = () => {
    setActiveTab('valuation');
  };

  const handleDegradation = () => {
    navigate('/ev-database?action=degradation');
  };

  const handleInspection = () => {
    navigate('/ev-database?action=inspection');
  };

  const tabs: { key: DashboardTab; label: string }[] = [
    { key: 'home', label: tr('tab_home') },
    { key: 'valuation', label: tr('tab_valuation') },
    { key: 'evdb', label: tr('tab_evdb') },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />


      {/* Tab content */}
      {activeTab === 'home' && (
        <div>
          <DashboardHero onVinFlow={handleVinFlow} onManualFlow={handleManualStart} />
          <DashboardServiceCards
            onCommercial={handleCommercial}
            onDegradation={handleDegradation}
            onInspection={handleInspection}
          />
          <DashboardFooter />
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          {vinResult && (vinResult.make || manualMode) ? (
            <EvaluationHub vinResult={vinResult as any} />
          ) : (
            <div>
              <EUAutoValueIntelligence
                onVehicleEvaluated={handleVehicleEvaluated}
                onVinIdentified={handleVinIdentified}
              />
              <div className="max-w-[680px] mx-auto mt-4">
                <button
                  onClick={handleManualStart}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition-colors"
                >
                  {tr('vin_manualButton')}
                </button>
              </div>
            </div>
          )}
          <MarketIntelligenceSection vehicle={vehicle} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

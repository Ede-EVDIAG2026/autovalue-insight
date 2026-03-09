import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import Step1Vehicle from '@/components/wizard/Step1Vehicle';
import Step2Analysis from '@/components/wizard/Step2Analysis';
import { useLanguage } from '@/i18n/LanguageContext';

export type VehicleData = {
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_mileage_km: number;
  vehicle_color: string;
  vehicle_fuel_type: string;
  service_book: boolean;
  owners_count: number;
  accident_free: boolean;
  target_country: string;
  linked_result_id?: string;
};

const AutoValuePage = () => {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);

  const stepLabels = [tr('step1_title'), tr('step2_title')];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                step === i + 1
                  ? 'bg-primary text-primary-foreground'
                  : step > i + 1
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                <span>{i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Step1Vehicle
            onNext={(data) => {
              setVehicleData(data);
              setStep(2);
            }}
          />
        )}
        {step === 2 && vehicleData && (
          <Step2Analysis
            vehicleData={vehicleData}
            onComplete={(result) => {
              setResultData(result);
              setStep(3);
            }}
          />
        )}
        {step === 3 && resultData && (
          <Step3Results
            result={resultData}
            vehicleData={vehicleData!}
            onNewValuation={() => {
              setStep(1);
              setVehicleData(null);
              setResultData(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AutoValuePage;

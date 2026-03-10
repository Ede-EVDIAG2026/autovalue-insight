import { useEffect, useState } from 'react';
import MarketValueCard, { MarketValuationResponse } from './MarketValueCard';

export interface ResultsStepProps {
  result: any;
  vehicleData: {
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_mileage_km: number;
    vehicle_fuel_type: string;
    vehicle_price_eur?: number;
    [key: string]: any;
  };
  /** @deprecated Use vehicleData.vehicle_price_eur instead */
  priceEur?: number;
  children?: React.ReactNode;
}

const ResultsStep = ({ result, vehicleData, priceEur, children }: ResultsStepProps) => {
  const [marketData, setMarketData] = useState<MarketValuationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectivePriceEur = vehicleData.vehicle_price_eur || priceEur || 0;

  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          make: vehicleData.vehicle_make,
          model: vehicleData.vehicle_model,
          year: String(vehicleData.vehicle_year),
          powertrain: vehicleData.vehicle_fuel_type,
          mileage_km: String(vehicleData.vehicle_mileage_km),
        });

        // Only include price_eur if available and > 0
        if (effectivePriceEur > 0) {
          params.set('price_eur', String(effectivePriceEur));
        }

        const res = await fetch(
          `http://46.224.176.213:8890/market/valuation?${params.toString()}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: MarketValuationResponse = await res.json();
        setMarketData(json);
      } catch (e: any) {
        setError(e.message || 'Ismeretlen hiba');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [
    vehicleData.vehicle_make,
    vehicleData.vehicle_model,
    vehicleData.vehicle_year,
    vehicleData.vehicle_fuel_type,
    vehicleData.vehicle_mileage_km,
    effectivePriceEur,
  ]);

  return (
    <div className="space-y-6">
      {children}
      <MarketValueCard
        data={marketData}
        loading={loading}
        error={error}
        priceEur={effectivePriceEur}
        queryYear={vehicleData.vehicle_year}
      />
    </div>
  );
};

export default ResultsStep;

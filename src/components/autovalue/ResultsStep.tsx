import { useEffect, useState } from 'react';
import MarketValueCard, { MarketValuationResponse } from './MarketValueCard';

export interface ResultsStepProps {
  /** Full result payload from the EV DIAG analysis */
  result: any;
  /** Vehicle input data from wizard steps */
  vehicleData: {
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_mileage_km: number;
    vehicle_fuel_type: string; // BEV / PHEV / HEV / MHEV
    [key: string]: any;
  };
  /** Price in EUR (from wizard step 2 or result payload) */
  priceEur: number;
  /** Existing children rendered above the market card */
  children?: React.ReactNode;
}

const ResultsStep = ({ result, vehicleData, priceEur, children }: ResultsStepProps) => {
  const [marketData, setMarketData] = useState<MarketValuationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          price_eur: String(priceEur),
        });

        const res = await fetch(
          `http://46.224.176.213:8890/market/valuation?${params.toString()}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: MarketValuationResponse = await res.json();
        setMarketData(json);
      } catch (e: any) {
        console.error('[MarketValuation] fetch error:', e);
        setError(e.message || 'Unknown error');
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
    priceEur,
  ]);

  return (
    <div className="space-y-6">
      {/* Existing result content passed as children */}
      {children}

      {/* Market comparison card */}
      <MarketValueCard
        data={marketData}
        loading={loading}
        error={error}
        priceEur={priceEur}
        queryYear={vehicleData.vehicle_year}
      />
    </div>
  );
};

export default ResultsStep;

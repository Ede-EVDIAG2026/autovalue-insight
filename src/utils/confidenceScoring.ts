/**
 * EV DIAG Confidence Scoring Engine
 * Frontend-safe interim scoring function.
 * Structured for easy replacement by backend logic later.
 */

export interface ConfidenceResult {
  confidenceScore: number;
  confidenceLabel: string;
  confidenceLabelKey: string;
}

export interface VehicleInputs {
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_mileage_km?: number;
  target_country?: string;
  vehicle_fuel_type?: string;
  vehicle_color?: string;
  service_book?: boolean;
  owners_count?: number;
  accident_free?: boolean;
  engine?: string;
  transmission?: string;
  equipment?: string;
}

export interface DataQualitySignals {
  hasComparableMarketData?: boolean;
  marketSampleCount?: number;
  backendConfidenceScore?: number | null;
  photoCount?: number;
}

export function calculateConfidence(
  inputs: VehicleInputs,
  signals: DataQualitySignals = {}
): ConfidenceResult {
  // If backend already provided a score, use it as base
  if (signals.backendConfidenceScore && signals.backendConfidenceScore > 0) {
    const boosted = Math.min(100, signals.backendConfidenceScore + (signals.photoCount || 0) * 3);
    return { confidenceScore: boosted, ...getLabel(boosted) };
  }

  let score = 40; // base

  // Core fields completeness (+5 each, max +25)
  if (inputs.vehicle_make) score += 5;
  if (inputs.vehicle_model) score += 5;
  if (inputs.vehicle_year) score += 5;
  if (inputs.vehicle_mileage_km) score += 5;
  if (inputs.target_country) score += 5;

  // Optional fields (+3 each, max +9)
  if (inputs.vehicle_fuel_type) score += 3;
  if (inputs.engine) score += 3;
  if (inputs.transmission) score += 3;

  // Condition signals (+3 each)
  if (inputs.service_book) score += 3;
  if (inputs.accident_free) score += 3;
  if (inputs.owners_count && inputs.owners_count <= 2) score += 2;

  // Mileage plausibility
  if (inputs.vehicle_year && inputs.vehicle_mileage_km) {
    const age = new Date().getFullYear() - inputs.vehicle_year;
    const avgKmPerYear = inputs.vehicle_mileage_km / Math.max(age, 1);
    if (avgKmPerYear >= 5000 && avgKmPerYear <= 30000) {
      score += 4; // plausible mileage
    } else {
      score -= 3; // unusual mileage
    }
  }

  // Vehicle age penalty
  if (inputs.vehicle_year) {
    const age = new Date().getFullYear() - inputs.vehicle_year;
    if (age > 15) score -= 5;
    else if (age > 10) score -= 2;
  }

  // Market data signals
  if (signals.hasComparableMarketData) score += 5;
  if (signals.marketSampleCount && signals.marketSampleCount >= 10) score += 5;
  else if (signals.marketSampleCount && signals.marketSampleCount >= 5) score += 2;

  // Photo boost
  score += (signals.photoCount || 0) * 3;

  const final = Math.max(0, Math.min(100, Math.round(score)));
  return { confidenceScore: final, ...getLabel(final) };
}

function getLabel(score: number): { confidenceLabel: string; confidenceLabelKey: string } {
  if (score >= 85) return { confidenceLabel: 'Magas pontosság', confidenceLabelKey: 'confidence_high' };
  if (score >= 70) return { confidenceLabel: 'Jó becslés', confidenceLabelKey: 'confidence_good' };
  if (score >= 50) return { confidenceLabel: 'Korlátozott adat', confidenceLabelKey: 'confidence_limited' };
  return { confidenceLabel: 'Bizonytalan becslés', confidenceLabelKey: 'confidence_uncertain' };
}

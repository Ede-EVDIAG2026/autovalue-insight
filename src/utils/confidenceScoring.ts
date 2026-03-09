/**
 * EV DIAG Confidence Scoring Engine v2
 * Frontend-safe interim scoring function.
 * Structured for easy replacement by backend logic later.
 *
 * Design principles:
 *  - Base score starts moderate (35) so empty forms read as uncertain
 *  - Core vehicle fields give the largest lift but are individually small (+3 each)
 *  - Optional / condition fields give diminishing additions (+1–2 each)
 *  - Mileage plausibility is a gentle adjustment (±2)
 *  - Photos give a small, capped bonus (max +5 total)
 *  - Market-data signals give the strongest single boost (up to +12)
 *  - Total theoretical max ≈ 96 without backend override
 *  - No single field change moves the needle more than ~4 points
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
  // If backend already provided a score, blend in a small photo bonus (max +5)
  if (signals.backendConfidenceScore && signals.backendConfidenceScore > 0) {
    const photoBump = Math.min((signals.photoCount || 0) * 1, 5);
    const final = Math.min(100, signals.backendConfidenceScore + photoBump);
    return { confidenceScore: final, ...getLabel(final) };
  }

  // ---------- Frontend interim scoring ----------
  let score = 35; // base — "we know nothing yet"

  // 1. Core fields completeness (+3 each, max +15)
  if (inputs.vehicle_make) score += 3;
  if (inputs.vehicle_model) score += 3;
  if (inputs.vehicle_year) score += 3;
  if (inputs.vehicle_mileage_km) score += 3;
  if (inputs.target_country) score += 3;

  // 2. Optional enrichment fields (+2 each, max +6)
  if (inputs.vehicle_fuel_type) score += 2;
  if (inputs.engine) score += 2;
  if (inputs.transmission) score += 2;

  // 3. Condition / provenance signals (+1–2 each, max +6)
  if (inputs.service_book) score += 2;
  if (inputs.accident_free) score += 2;
  if (inputs.owners_count != null && inputs.owners_count > 0 && inputs.owners_count <= 3) score += 1;
  if (inputs.vehicle_color) score += 1;

  // 4. Mileage plausibility (gentle ±2)
  if (inputs.vehicle_year && inputs.vehicle_mileage_km) {
    const age = Math.max(new Date().getFullYear() - inputs.vehicle_year, 1);
    const avgKmPerYear = inputs.vehicle_mileage_km / age;
    if (avgKmPerYear >= 5000 && avgKmPerYear <= 25000) {
      score += 2; // plausible
    } else if (avgKmPerYear > 40000 || avgKmPerYear < 1000) {
      score -= 2; // very unusual
    }
    // else: slightly unusual — no change
  }

  // 5. Vehicle age adjustment (gentle, max ±2)
  if (inputs.vehicle_year) {
    const age = new Date().getFullYear() - inputs.vehicle_year;
    if (age > 20) score -= 2;
    else if (age > 12) score -= 1;
  }

  // 6. Market data signals (strongest factor, max +12)
  if (signals.hasComparableMarketData) score += 4;
  if (signals.marketSampleCount != null) {
    if (signals.marketSampleCount >= 20) score += 8;
    else if (signals.marketSampleCount >= 10) score += 6;
    else if (signals.marketSampleCount >= 5) score += 3;
    else if (signals.marketSampleCount >= 1) score += 1;
  }

  // 7. Photo bonus — capped at +5 total (+1 per photo, max 5)
  score += Math.min((signals.photoCount || 0) * 1, 5);

  const final = Math.max(0, Math.min(100, Math.round(score)));
  return { confidenceScore: final, ...getLabel(final) };
}

function getLabel(score: number): { confidenceLabel: string; confidenceLabelKey: string } {
  if (score >= 85) return { confidenceLabel: 'Magas pontosság', confidenceLabelKey: 'confidence_high' };
  if (score >= 70) return { confidenceLabel: 'Jó becslés', confidenceLabelKey: 'confidence_good' };
  if (score >= 50) return { confidenceLabel: 'Korlátozott adat', confidenceLabelKey: 'confidence_limited' };
  return { confidenceLabel: 'Bizonytalan becslés', confidenceLabelKey: 'confidence_uncertain' };
}

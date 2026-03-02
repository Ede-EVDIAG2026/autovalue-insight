
-- Értékbecslési munkamenetek
CREATE TABLE public.auto_value_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_result_id uuid,
  linked_session_id uuid,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer NOT NULL,
  vehicle_mileage_km integer NOT NULL,
  vehicle_color text,
  vehicle_fuel_type text DEFAULT 'BEV',
  vehicle_vin text,
  service_book boolean DEFAULT false,
  owners_count integer DEFAULT 1,
  accident_free boolean DEFAULT true,
  target_country text DEFAULT 'HU',
  target_region text,
  linked_condition_score numeric,
  linked_repair_cost_eur numeric,
  linked_repair_cost_huf numeric,
  linked_pdr_count integer,
  linked_negotiation_summary text,
  linked_value_reduction_pct numeric,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Értékbecslési eredmények
CREATE TABLE public.auto_value_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.auto_value_sessions(id) ON DELETE CASCADE,
  user_id uuid,
  schema_version text DEFAULT '1.0.0',
  payload jsonb NOT NULL DEFAULT '{}',
  p10_eur numeric, p25_eur numeric,
  p50_eur numeric, p75_eur numeric, p90_eur numeric,
  p10_huf numeric, p25_huf numeric,
  p50_huf numeric, p75_huf numeric, p90_huf numeric,
  recommended_ask_eur numeric,
  recommended_ask_huf numeric,
  negotiation_floor_eur numeric,
  negotiation_floor_huf numeric,
  sales_velocity_days integer,
  confidence_score numeric,
  market_risk_score numeric,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Piaci pillanatképek
CREATE TABLE public.auto_value_market_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer NOT NULL,
  country text NOT NULL,
  snapshot_date date DEFAULT CURRENT_DATE,
  p50_eur numeric,
  sample_count integer,
  source text DEFAULT 'ai_estimate',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.auto_value_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_value_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_value_market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sessions" ON public.auto_value_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_results" ON public.auto_value_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "snapshots_read" ON public.auto_value_market_snapshots
  FOR SELECT USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_auto_value_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_auto_value_sessions_updated_at
  BEFORE UPDATE ON public.auto_value_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_auto_value_updated_at();

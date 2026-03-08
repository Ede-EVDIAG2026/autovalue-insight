
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "own_sessions" ON public.auto_value_sessions;
CREATE POLICY "own_sessions" ON public.auto_value_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_results" ON public.auto_value_results;
CREATE POLICY "own_results" ON public.auto_value_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "snapshots_read" ON public.auto_value_market_snapshots;
CREATE POLICY "snapshots_read" ON public.auto_value_market_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

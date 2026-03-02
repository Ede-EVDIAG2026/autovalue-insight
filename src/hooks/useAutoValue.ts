import { supabase } from '@/integrations/supabase/client';

export type AutoValueSessionInput = {
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_mileage_km: number;
  vehicle_color?: string;
  vehicle_fuel_type?: string;
  service_book?: boolean;
  owners_count?: number;
  accident_free?: boolean;
  target_country?: string;
  linked_result_id?: string;
  linked_session_id?: string;
};

export const useAutoValue = () => {
  const createSession = async (data: AutoValueSessionInput) => {
    return supabase.from('auto_value_sessions').insert(data as any).select().single();
  };

  const runAnalysis = async (sessionId: string) => {
    return supabase.functions.invoke('run-auto-value-analysis', {
      body: { autoValueSessionId: sessionId },
    });
  };

  const pollResult = (sessionId: string, timeoutMs = 120000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(async () => {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error('Timeout'));
          return;
        }
        const { data } = await supabase
          .from('auto_value_results')
          .select('*')
          .eq('session_id', sessionId)
          .eq('status', 'completed')
          .maybeSingle();
        if (data) {
          clearInterval(interval);
          resolve(data);
        }
      }, 2000);
    });
  };

  const loadLinkedDamageResult = async (resultId: string) => {
    // Cross-project table - use type assertion
    return (supabase as any).from('analysis_results').select('payload').eq('id', resultId).single();
  };

  const getRecentScanSessions = async (limit = 5) => {
    // Cross-project table - use type assertion
    return (supabase as any)
      .from('scan_sessions')
      .select('id, vehicle_make, vehicle_model, vehicle_year, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
  };

  return { createSession, runAnalysis, pollResult, loadLinkedDamageResult, getRecentScanSessions };
};

import {
  createSession as apiCreateSession,
  runAnalysis as apiRunAnalysis,
  pollResult as apiPollResult,
  getSession as apiGetSession,
  listSessions as apiListSessions,
  type CreateSessionInput,
} from '@/lib/avApi';
import { fetchWithAuth } from '@/lib/apiClient';

export type AutoValueSessionInput = CreateSessionInput;

export const useAutoValue = () => {
  const createSession = async (data: AutoValueSessionInput) => {
    try {
      const result = await apiCreateSession(data);
      return { data: result, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  };

  const runAnalysis = async (sessionId: string) => {
    try {
      const result = await apiRunAnalysis(sessionId);
      return { data: result, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  };

  const pollResult = (sessionId: string, timeoutMs = 120000) => {
    return apiPollResult(sessionId, timeoutMs);
  };

  const loadLinkedDamageResult = async (resultId: string) => {
    try {
      const res = await fetchWithAuth(`/analysis-results/${resultId}`);
      if (!res.ok) return { data: null, error: { message: 'Not found' } };
      const data = await res.json();
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  };

  const getRecentScanSessions = async (limit = 5) => {
    try {
      const res = await fetchWithAuth(`/scan-sessions?limit=${limit}`);
      if (!res.ok) return { data: [], error: null };
      const data = await res.json();
      return { data: data.sessions || data || [], error: null };
    } catch {
      return { data: [], error: null };
    }
  };

  return { createSession, runAnalysis, pollResult, loadLinkedDamageResult, getRecentScanSessions };
};

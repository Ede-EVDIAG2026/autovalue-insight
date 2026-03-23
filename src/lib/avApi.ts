/**
 * AutoValue API client — replaces direct Supabase calls
 * Backend: https://api.evdiag.hu
 */

const BASE = 'https://api.evdiag.hu';

function getToken(): string | null {
  return localStorage.getItem('evdiag_token');
}

async function request(
  method: string,
  path: string,
  body?: any,
  auth = true
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Sessions ──────────────────────────────────

export interface CreateSessionInput {
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_mileage_km: number;
  vehicle_vin?: string;
  vehicle_fuel_type?: string;
  vehicle_color?: string;
  accident_free?: boolean;
  service_book?: boolean;
  owners_count?: number;
  target_country?: string;
  target_region?: string;
  linked_session_id?: string;
  linked_result_id?: string;
  linked_condition_score?: number;
  linked_repair_cost_eur?: number;
  linked_pdr_count?: number;
  linked_negotiation_summary?: string;
  linked_value_reduction_pct?: number;
}

export async function createSession(data: CreateSessionInput) {
  return request('POST', '/autovalue/sessions', data);
}

export async function getSession(id: string) {
  return request('GET', `/autovalue/sessions/${id}`);
}

export async function listSessions() {
  return request('GET', '/autovalue/sessions');
}

// ── Results ───────────────────────────────────

export async function createResult(data: any) {
  return request('POST', '/autovalue/results', data);
}

export async function getResult(id: string) {
  return request('GET', `/autovalue/results/${id}`);
}

// ── Edge function (analysis) — still on Supabase ──

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function runAnalysis(sessionId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/run-auto-value-analysis`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ autoValueSessionId: sessionId }),
      signal: AbortSignal.timeout(120000),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Analysis HTTP ${res.status}`);
  }
  return res.json();
}

// ── Poll result from backend API ──────────────

export async function pollResult(
  sessionId: string,
  timeoutMs = 120000
): Promise<any> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Timeout'));
        return;
      }
      try {
        const data = await request(
          'GET',
          `/autovalue/results?session_id=${sessionId}&status=completed`,
          undefined,
          true
        ).catch(() => null);
        if (data && (data.id || data.results?.[0])) {
          clearInterval(interval);
          resolve(data.results?.[0] || data);
        }
      } catch {
        // keep polling
      }
    }, 2500);
  });
}

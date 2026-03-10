const API_BASE = 'https://api.evdiag.hu';
const TOKEN_KEY = 'evdiag_token';
const REFRESH_KEY = 'evdiag_refresh';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefresh = () => localStorage.getItem(REFRESH_KEY);
export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getToken();
  const makeReq = (t: string | null) => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers || {})
    }
  });

  let res = await makeReq(token);
  if (res.status === 401) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    token = await refreshPromise;
    if (!token) { clearTokens(); window.location.href = '/'; return res; }
    res = await makeReq(token);
  }
  return res;
}

export { API_BASE };

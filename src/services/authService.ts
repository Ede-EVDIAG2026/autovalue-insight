import { API_BASE, setTokens, clearTokens } from '../lib/apiClient';

export interface UserInfo {
  dealer_id: string;
  email: string;
  name: string;
  plan: string;
  is_admin?: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  gdpr_accepted: boolean;
  marketing_consent: boolean;
  dealer_type: 'B2C';
  contact_name: string;
  country: string;
  address_city: string;
  phone: string;
}

export async function login(
  email: string,
  password: string
): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Hibás email vagy jelszó');
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.dealer || {
    dealer_id: data.dealer_id,
    email: data.email,
    name: data.dealer_name || data.email,
    plan: data.plan || 'free'
  };
}

export async function register(input: RegisterInput): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Regisztrációs hiba');
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.dealer;
}

export async function getMe(): Promise<UserInfo | null> {
  const { fetchWithAuth } = await import('../lib/apiClient');
  try {
    const res = await fetchWithAuth('/auth/me');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getGdprStatus(): Promise<boolean> {
  const { fetchWithAuth } = await import('../lib/apiClient');
  try {
    const res = await fetchWithAuth('/auth/gdpr-status');
    if (!res.ok) return false;
    const data = await res.json();
    return data.accepted;
  } catch {
    return false;
  }
}

export async function acceptGdpr(): Promise<void> {
  const { fetchWithAuth } = await import('../lib/apiClient');
  await fetchWithAuth('/auth/gdpr-accept', { method: 'POST' });
}

export async function logout(): Promise<void> {
  const { fetchWithAuth } = await import('../lib/apiClient');
  try {
    await fetchWithAuth('/auth/logout');
  } catch {
    // silent
  }
  clearTokens();
}

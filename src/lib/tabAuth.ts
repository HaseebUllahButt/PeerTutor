/** Per-tab JWT so multiple accounts can stay logged in in different tabs (sessionStorage is tab-scoped). */
const TAB_TOKEN_KEY = 'peertutor_tab_token';

export function getTabAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(TAB_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTabAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TAB_TOKEN_KEY, token);
  } catch {
    /* quota / private mode */
  }
}

export function clearTabAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TAB_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Populate tab token from httpOnly cookie once (e.g. legacy tab or dashboard-only visits). */
export async function ensureTabAuthTokenFromCookie(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (getTabAuthToken()) return true;
  try {
    const r = await fetch('/api/auth/tab-session', { credentials: 'include' });
    if (!r.ok) return false;
    const d = await r.json();
    if (typeof d.token === 'string' && d.token.length > 0) {
      setTabAuthToken(d.token);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

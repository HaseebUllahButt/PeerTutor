import { getTabAuthToken } from '@/lib/tabAuth';

/** Attach tab Bearer token when present; keeps cookie fallback via credentials. */
export function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getTabAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}

import { cookies } from 'next/headers';

/**
 * Prefer Authorization Bearer (per-tab sessionStorage) over shared httpOnly cookie.
 * Bearer must win when both differ — otherwise the last login's cookie breaks other tabs.
 */
export async function resolveAuthToken(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    if (t.length > 0) return t;
  }
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value ?? null;
}

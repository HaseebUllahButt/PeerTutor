import { signToken } from '@/lib/auth';
import User from '@/models/User';
import type { JWTPayload } from '@/lib/auth';

export { setMockCookie, clearMockCookies } from './setup';

export interface SeedUserOpts {
  name?: string;
  email?: string;
  password?: string;
  role?: 'student' | 'tutor' | 'admin';
  hourlyRate?: number;
  subjects?: string[];
}

/** Create a real User in the in-memory DB and return user + a signed JWT. */
export async function seedUser(opts: SeedUserOpts = {}) {
  const role = opts.role ?? 'student';
  const data: Record<string, unknown> = {
    name: opts.name ?? 'Test User',
    email: opts.email ?? `${role}-${Date.now()}-${Math.random()}@nust.edu.pk`,
    password: opts.password ?? 'password123',
    role,
  };
  if (role === 'tutor') {
    data.tutorProfile = {
      subjects: opts.subjects ?? ['Math'],
      hourlyRate: opts.hourlyRate ?? 1000,
      bio: 'Test tutor bio',
      schedule: {
        mode: 'simple',
        simpleSchedule: { startHour: 9, endHour: 17 },
      },
      unavailableSlots: [],
    };
  }
  const user = await User.create(data);
  const payload: JWTPayload = {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  };
  const token = signToken(payload);
  return { user, token };
}

export function jsonRequest(
  url: string,
  body: unknown,
  init: { method?: string; bearer?: string } = {}
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.bearer) headers['authorization'] = `Bearer ${init.bearer}`;
  return new Request(url, {
    method: init.method ?? 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function getRequest(url: string, bearer?: string): Request {
  const headers: Record<string, string> = {};
  if (bearer) headers['authorization'] = `Bearer ${bearer}`;
  return new Request(url, { method: 'GET', headers });
}

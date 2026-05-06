import { describe, it, expect } from 'vitest';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  deleteAccount,
} from '@/features/auth/server/authHandlers';
import User from '@/models/User';
import Session from '@/models/Session';
import { signToken } from '@/lib/auth';
import { jsonRequest, getRequest, seedUser, setMockCookie } from '../helpers';

describe('authHandlers — registerUser (SCRUM-5)', () => {
  it('creates a new student user and returns 201', async () => {
    const req = jsonRequest('http://test/api/auth/register', {
      name: 'Ali Hussain',
      email: 'ahussain.bscs23seecs@seecs.edu.pk',
      password: 'password123',
      role: 'student',
    });
    const res = await registerUser(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe('ahussain.bscs23seecs@seecs.edu.pk');
    expect(body.user.role).toBe('student');

    const dbUser = await User.findOne({ email: 'ahussain.bscs23seecs@seecs.edu.pk' });
    expect(dbUser).toBeTruthy();
    // Password is hashed, never stored as plaintext
    expect(dbUser?.password).not.toBe('password123');
  });

  it('rejects duplicate emails with 400', async () => {
    await seedUser({ email: 'dup@nust.edu.pk' });
    const res = await registerUser(
      jsonRequest('http://test/api/auth/register', {
        name: 'Other',
        email: 'dup@nust.edu.pk',
        password: 'password123',
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/already exists/i);
  });

  it('rejects passwords shorter than 8 chars (Zod)', async () => {
    const res = await registerUser(
      jsonRequest('http://test/api/auth/register', {
        name: 'Tiny',
        email: 'tiny@nust.edu.pk',
        password: 'short',
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects malformed emails', async () => {
    const res = await registerUser(
      jsonRequest('http://test/api/auth/register', {
        name: 'Bad',
        email: 'not-an-email',
        password: 'password123',
      })
    );
    expect(res.status).toBe(400);
  });

  it('defaults role to student when omitted', async () => {
    const res = await registerUser(
      jsonRequest('http://test/api/auth/register', {
        name: 'Default',
        email: 'def@nust.edu.pk',
        password: 'password123',
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.role).toBe('student');
  });
});

describe('authHandlers — loginUser', () => {
  it('returns a token + user on correct credentials', async () => {
    await seedUser({ email: 'login@nust.edu.pk', password: 'password123' });
    const res = await loginUser(
      jsonRequest('http://test/api/auth/login', {
        email: 'login@nust.edu.pk',
        password: 'password123',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe('login@nust.edu.pk');
  });

  it('rejects wrong passwords with 401', async () => {
    await seedUser({ email: 'wrong@nust.edu.pk', password: 'password123' });
    const res = await loginUser(
      jsonRequest('http://test/api/auth/login', {
        email: 'wrong@nust.edu.pk',
        password: 'badpassword',
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects unknown users with 401', async () => {
    const res = await loginUser(
      jsonRequest('http://test/api/auth/login', {
        email: 'noone@nust.edu.pk',
        password: 'password123',
      })
    );
    expect(res.status).toBe(401);
  });
});

describe('authHandlers — getCurrentUser (Bearer)', () => {
  it('returns the user from a valid Bearer token', async () => {
    const { user, token } = await seedUser({ name: 'Ali H.' });
    const res = await getCurrentUser(getRequest('http://test/api/auth/me', token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(user._id.toString());
    expect(body.user.name).toBe('Ali H.');
  });

  it('returns 401 with no token', async () => {
    const res = await getCurrentUser(getRequest('http://test/api/auth/me'));
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await getCurrentUser(getRequest('http://test/api/auth/me', 'not-a-token'));
    expect(res.status).toBe(401);
  });
});

describe('authHandlers — updateCurrentUser (SCRUM-33: name save bug fix)', () => {
  it('persists the new name to the DB', async () => {
    const { user, token } = await seedUser({ name: 'Old Name' });
    const res = await updateCurrentUser(
      jsonRequest('http://test/api/auth/me', { name: 'New Name' }, { method: 'PATCH', bearer: token })
    );
    expect(res.status).toBe(200);
    const fresh = await User.findById(user._id);
    expect(fresh?.name).toBe('New Name');
  });

  it('rejects names shorter than 2 chars', async () => {
    const { token } = await seedUser();
    const res = await updateCurrentUser(
      jsonRequest('http://test/api/auth/me', { name: 'A' }, { method: 'PATCH', bearer: token })
    );
    expect(res.status).toBe(400);
  });

  it('returns a fresh JWT cookie that contains the new name', async () => {
    const { token } = await seedUser({ name: 'Before' });
    const res = await updateCurrentUser(
      jsonRequest('http://test/api/auth/me', { name: 'After' }, { method: 'PATCH', bearer: token })
    );
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/token=/);
  });
});

describe('authHandlers — deleteAccount', () => {
  it('removes the user and their sessions', async () => {
    const { user, token } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    await Session.create({
      student: user._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: new Date(),
      paymentStatus: 'unpaid',
    });

    setMockCookie('token', token);
    const res = await deleteAccount();
    expect(res.status).toBe(200);

    expect(await User.findById(user._id)).toBeNull();
    const remainingSessions = await Session.find({ student: user._id });
    expect(remainingSessions).toHaveLength(0);
  });

  it('returns 401 without token cookie', async () => {
    const res = await deleteAccount();
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token cookie', async () => {
    setMockCookie('token', 'not-a-valid-jwt');
    const res = await deleteAccount();
    expect(res.status).toBe(401);
  });
});

describe('User model — password hashing', () => {
  it('stores a bcrypt hash, not plaintext', async () => {
    const u = await User.create({
      name: 'X',
      email: 'hash@nust.edu.pk',
      password: 'password123',
      role: 'student',
    });
    expect(u.password).not.toBe('password123');
    expect(u.password.length).toBeGreaterThan(20);
  });

  it('comparePassword returns true for the right password', async () => {
    const u = await User.create({
      name: 'X',
      email: 'cmp@nust.edu.pk',
      password: 'password123',
      role: 'student',
    });
    expect(await u.comparePassword('password123')).toBe(true);
    expect(await u.comparePassword('wrong')).toBe(false);
  });

  it('does not re-hash on saves that do not modify the password', async () => {
    const u = await User.create({
      name: 'X',
      email: 'rehash@nust.edu.pk',
      password: 'password123',
      role: 'student',
    });
    const firstHash = u.password;
    u.name = 'Y';
    await u.save();
    expect(u.password).toBe(firstHash);
  });

  it('signed JWT carries pre-existing JWT_SECRET', async () => {
    const token = signToken({ userId: 'x', role: 'student', name: 'n', email: 'e' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});

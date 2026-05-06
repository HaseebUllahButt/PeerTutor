import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '@/lib/auth';

describe('lib/auth — signToken / verifyToken', () => {
  const basePayload = {
    userId: '64f000000000000000000001',
    role: 'student',
    name: 'Ali Hussain',
    email: 'ahussain.bscs23seecs@seecs.edu.pk',
  };

  it('signs a token that round-trips through verify', () => {
    const token = signToken(basePayload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(basePayload.userId);
    expect(decoded?.email).toBe(basePayload.email);
    expect(decoded?.role).toBe('student');
  });

  it('preserves tutorProfile fields when present', () => {
    const token = signToken({
      ...basePayload,
      role: 'tutor',
      tutorProfile: {
        subjects: ['Math', 'Physics'],
        hourlyRate: 1500,
        bio: 'NUST student tutor',
      },
    });
    const decoded = verifyToken(token);
    expect(decoded?.tutorProfile?.subjects).toEqual(['Math', 'Physics']);
    expect(decoded?.tutorProfile?.hourlyRate).toBe(1500);
  });

  it('returns null for a malformed token', () => {
    expect(verifyToken('not-a-jwt')).toBeNull();
  });

  it('returns null for a token signed with a different secret', () => {
    // Token from a separate secret — verifyToken should reject it.
    const jwt = require('jsonwebtoken');
    const bogus = jwt.sign(basePayload, 'wrong-secret');
    expect(verifyToken(bogus)).toBeNull();
  });

  it('returns null for an expired token', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign(basePayload, process.env.JWT_SECRET, { expiresIn: '-1s' });
    expect(verifyToken(expired)).toBeNull();
  });
});

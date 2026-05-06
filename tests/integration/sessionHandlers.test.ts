import { describe, it, expect } from 'vitest';
import {
  createSession,
  listSessions,
  cancelSession,
  reviewSession,
  updateSessionStatus,
  payForSession,
  verifySessionPayment,
} from '@/features/sessions/server/sessionHandlers';
import Session from '@/models/Session';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { jsonRequest, getRequest, seedUser, setMockCookie } from '../helpers';

const futureDate = (daysAhead = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d;
};

async function makeParams(id: string) {
  return Promise.resolve({ id });
}

describe('createSession — SCRUM-7 (book via calendar)', () => {
  it('books a session for a valid student + tutor', async () => {
    const { token: studentTok } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor', hourlyRate: 1500 });

    const res = await createSession(
      jsonRequest(
        'http://test/api/sessions',
        {
          tutorId: tutor._id.toString(),
          subject: 'Math',
          scheduledAt: futureDate().toISOString(),
          duration: 1.5,
        },
        { bearer: studentTok }
      )
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.session.subject).toBe('Math');
    // Amount = hourlyRate * duration = 1500 * 1.5 = 2250
    expect(body.session.amount).toBe(2250);
    expect(body.session.paymentStatus).toBe('unpaid');
    expect(body.session.status).toBe('pending');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await createSession(
      jsonRequest('http://test/api/sessions', {
        tutorId: 'x',
        subject: 'Math',
        scheduledAt: new Date().toISOString(),
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects when caller is not a student (role=tutor)', async () => {
    const { token } = await seedUser({ role: 'tutor' });
    const { user: otherTutor } = await seedUser({ role: 'tutor' });
    const res = await createSession(
      jsonRequest(
        'http://test/api/sessions',
        {
          tutorId: otherTutor._id.toString(),
          subject: 'Math',
          scheduledAt: futureDate().toISOString(),
        },
        { bearer: token }
      )
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when tutor does not exist', async () => {
    const { token } = await seedUser({ role: 'student' });
    const res = await createSession(
      jsonRequest(
        'http://test/api/sessions',
        {
          tutorId: '64f0aaaaaaaaaaaaaaaaaaaa',
          subject: 'Math',
          scheduledAt: futureDate().toISOString(),
        },
        { bearer: token }
      )
    );
    expect(res.status).toBe(404);
  });

  it('rejects invalid date format with 400', async () => {
    const { token } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    const res = await createSession(
      jsonRequest(
        'http://test/api/sessions',
        {
          tutorId: tutor._id.toString(),
          subject: 'Math',
          scheduledAt: 'not-a-date',
        },
        { bearer: token }
      )
    );
    expect(res.status).toBe(400);
  });

  it('rejects duration outside 0.5–8 hours', async () => {
    const { token } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    const res = await createSession(
      jsonRequest(
        'http://test/api/sessions',
        {
          tutorId: tutor._id.toString(),
          subject: 'Math',
          scheduledAt: futureDate().toISOString(),
          duration: 12,
        },
        { bearer: token }
      )
    );
    expect(res.status).toBe(400);
  });
});

describe('listSessions — role filtering', () => {
  it('students see sessions where they are the student', async () => {
    const { user: student, token } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    const { user: otherStudent } = await seedUser({ role: 'student' });

    await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
    });
    await Session.create({
      student: otherStudent._id,
      tutor: tutor._id,
      subject: 'Physics',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
    });

    const res = await listSessions(getRequest('http://test/api/sessions', token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].subject).toBe('Math');
  });

  it('tutors see sessions where they are the tutor', async () => {
    const { user: student } = await seedUser({ role: 'student' });
    const { user: tutor, token } = await seedUser({ role: 'tutor' });
    await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Physics',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
    });
    const res = await listSessions(getRequest('http://test/api/sessions', token));
    const body = await res.json();
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].subject).toBe('Physics');
  });
});

describe('updateSessionStatus — SCRUM-13 (tutor accept/decline)', () => {
  it('tutor can accept a pending session', async () => {
    const { user: student } = await seedUser({ role: 'student' });
    const { user: tutor, token } = await seedUser({ role: 'tutor' });
    const session = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
    });

    setMockCookie('token', token);
    const res = await updateSessionStatus(
      jsonRequest('http://test/api/sessions/x', { status: 'accepted' }, { method: 'PATCH' }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(200);
    const updated = await Session.findById(session._id);
    expect(updated?.status).toBe('accepted');
  });

  it('marks completedAt when status=completed', async () => {
    const { user: student } = await seedUser({ role: 'student' });
    const { user: tutor, token } = await seedUser({ role: 'tutor' });
    const session = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(),
      paymentStatus: 'paid',
      status: 'accepted',
    });
    setMockCookie('token', token);
    await updateSessionStatus(
      jsonRequest('http://test/api/sessions/x', { status: 'completed' }, { method: 'PATCH' }),
      { params: makeParams(session._id.toString()) }
    );
    const updated = await Session.findById(session._id);
    expect(updated?.status).toBe('completed');
    expect(updated?.completedAt).toBeTruthy();
  });

  it('rejects students attempting to update status (403)', async () => {
    const { token } = await seedUser({ role: 'student' });
    setMockCookie('token', token);
    const res = await updateSessionStatus(
      jsonRequest('http://test/api/sessions/x', { status: 'accepted' }, { method: 'PATCH' }),
      { params: makeParams('64f0aaaaaaaaaaaaaaaaaaaa') }
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 for sessions belonging to a different tutor', async () => {
    const { user: student } = await seedUser({ role: 'student' });
    const { user: ownerTutor } = await seedUser({ role: 'tutor' });
    const { token: otherTok } = await seedUser({ role: 'tutor' });
    const session = await Session.create({
      student: student._id,
      tutor: ownerTutor._id,
      subject: 'X',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
    });
    setMockCookie('token', otherTok);
    const res = await updateSessionStatus(
      jsonRequest('http://test/api/sessions/x', { status: 'accepted' }, { method: 'PATCH' }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(404);
  });
});

describe('cancelSession — SCRUM-10', () => {
  async function makeAcceptedSession() {
    const { user: student, token: studentTok } = await seedUser({ role: 'student' });
    const { user: tutor, token: tutorTok } = await seedUser({ role: 'tutor' });
    const session = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
      status: 'accepted',
    });
    return { student, studentTok, tutor, tutorTok, session };
  }

  it('student can cancel their session', async () => {
    const { studentTok, session } = await makeAcceptedSession();
    setMockCookie('token', studentTok);
    const res = await cancelSession(
      jsonRequest('http://test/api/sessions/x/cancel', { reason: 'busy' }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(200);
    const updated = await Session.findById(session._id);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.cancelledBy).toBe('student');
    expect(updated?.cancellationReason).toBe('busy');
  });

  it('tutor cancellation increments cancellationCount on tutorProfile', async () => {
    const { tutor, tutorTok, session } = await makeAcceptedSession();
    setMockCookie('token', tutorTok);
    const res = await cancelSession(
      jsonRequest('http://test/api/sessions/x/cancel', { reason: 'sick' }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(200);
    const updated = await Session.findById(session._id);
    expect(updated?.cancelledBy).toBe('tutor');
    const fresh = await User.findById(tutor._id);
    expect(fresh?.tutorProfile?.cancellationCount).toBe(1);
    expect(fresh?.tutorProfile?.cancellationRate).toBeGreaterThan(0);
  });

  it('rejects cancelling an already-completed session', async () => {
    const { studentTok, session } = await makeAcceptedSession();
    session.status = 'completed';
    await session.save();
    setMockCookie('token', studentTok);
    const res = await cancelSession(
      jsonRequest('http://test/api/sessions/x/cancel', {}),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(400);
  });

  it('rejects double cancellation', async () => {
    const { studentTok, session } = await makeAcceptedSession();
    session.status = 'cancelled';
    await session.save();
    setMockCookie('token', studentTok);
    const res = await cancelSession(
      jsonRequest('http://test/api/sessions/x/cancel', {}),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(400);
  });

  it('rejects unrelated users with 403', async () => {
    const { session } = await makeAcceptedSession();
    const { token: outsiderTok } = await seedUser({ role: 'student' });
    setMockCookie('token', outsiderTok);
    const res = await cancelSession(
      jsonRequest('http://test/api/sessions/x/cancel', {}),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(403);
  });
});

describe('reviewSession — SCRUM-9 (1-5 stars, only completed sessions)', () => {
  async function completedSession() {
    const { user: student, token } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    const session = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(-1),
      paymentStatus: 'paid',
      status: 'completed',
      completedAt: new Date(),
    });
    return { student, tutor, token, session };
  }

  it('accepts a 1–5 rating on a completed session', async () => {
    const { token, session } = await completedSession();
    setMockCookie('token', token);
    const res = await reviewSession(
      jsonRequest('http://test/api/sessions/x/review', { rating: 5, review: 'Excellent!' }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(200);
    const updated = await Session.findById(session._id);
    expect(updated?.rating).toBe(5);
    expect(updated?.review).toBe('Excellent!');
  });

  it('rejects ratings below 1', async () => {
    const { token, session } = await completedSession();
    setMockCookie('token', token);
    const res = await reviewSession(
      jsonRequest('http://test/api/sessions/x/review', { rating: 0 }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(400);
  });

  it('rejects ratings above 5', async () => {
    const { token, session } = await completedSession();
    setMockCookie('token', token);
    const res = await reviewSession(
      jsonRequest('http://test/api/sessions/x/review', { rating: 6 }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(400);
  });

  it('rejects review on a non-completed session', async () => {
    const { user: student, token } = await seedUser({ role: 'student' });
    const { user: tutor } = await seedUser({ role: 'tutor' });
    const session = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
      status: 'pending',
    });
    setMockCookie('token', token);
    const res = await reviewSession(
      jsonRequest('http://test/api/sessions/x/review', { rating: 4 }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(400);
  });

  it('updates the tutor averageRating after a review', async () => {
    const { tutor, token, session } = await completedSession();
    setMockCookie('token', token);
    await reviewSession(
      jsonRequest('http://test/api/sessions/x/review', { rating: 4 }),
      { params: makeParams(session._id.toString()) }
    );
    const fresh = await User.findById(tutor._id);
    expect(fresh?.tutorProfile?.averageRating).toBe(4);
    expect(fresh?.tutorProfile?.reviewCount).toBe(1);
  });
});

describe('payForSession + verifySessionPayment (SCRUM-29 payment flow)', () => {
  async function paidSetup() {
    const { user: student, token: studentTok } = await seedUser({ role: 'student' });
    const { user: tutor, token: tutorTok } = await seedUser({ role: 'tutor', hourlyRate: 1000 });
    const session = await Session.create({
      student: student._id,
      tutor: tutor._id,
      subject: 'Math',
      scheduledAt: futureDate(),
      paymentStatus: 'unpaid',
      amount: 1500,
      duration: 1.5,
      hourlyRate: 1000,
    });
    return { student, studentTok, tutor, tutorTok, session };
  }

  it('student can pay for their session', async () => {
    const { studentTok, session } = await paidSetup();
    const res = await payForSession(
      jsonRequest(
        'http://test/api/sessions/x/pay',
        { transactionId: 'TXN1', paymentMethod: 'jazzcash' },
        { bearer: studentTok }
      ),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(200);
    const updated = await Session.findById(session._id);
    expect(updated?.paymentStatus).toBe('paid');
    const payment = await Payment.findOne({ sessionId: session._id });
    expect(payment).toBeTruthy();
    // 15% platform fee on 1500 = 225, tutor gets 1275
    expect(payment?.platformFee).toBe(225);
    expect(payment?.tutorEarnings).toBe(1275);
  });

  it('rejects students paying for someone else\'s session', async () => {
    const { session } = await paidSetup();
    const { token: outsiderTok } = await seedUser({ role: 'student' });
    const res = await payForSession(
      jsonRequest('http://test/api/sessions/x/pay', {}, { bearer: outsiderTok }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(403);
  });

  it('rejects non-students attempting to pay (403)', async () => {
    const { session } = await paidSetup();
    const { token: tutorTok } = await seedUser({ role: 'tutor' });
    const res = await payForSession(
      jsonRequest('http://test/api/sessions/x/pay', {}, { bearer: tutorTok }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(403);
  });

  it('tutor can verify a paid session', async () => {
    const { studentTok, tutorTok, session } = await paidSetup();
    await payForSession(
      jsonRequest('http://test/api/sessions/x/pay', {}, { bearer: studentTok }),
      { params: makeParams(session._id.toString()) }
    );
    const res = await verifySessionPayment(
      jsonRequest('http://test/api/sessions/x/verify-payment', { verified: true }, { bearer: tutorTok }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(200);
    const updated = await Session.findById(session._id);
    expect(updated?.tutorPaymentStatus).toBe('verified');
  });

  it('verification on an unpaid session is rejected', async () => {
    const { tutorTok, session } = await paidSetup();
    const res = await verifySessionPayment(
      jsonRequest('http://test/api/sessions/x/verify-payment', { verified: true }, { bearer: tutorTok }),
      { params: makeParams(session._id.toString()) }
    );
    expect(res.status).toBe(400);
  });

  it('verified=false marks session as disputed', async () => {
    const { studentTok, tutorTok, session } = await paidSetup();
    await payForSession(
      jsonRequest('http://test/api/sessions/x/pay', {}, { bearer: studentTok }),
      { params: makeParams(session._id.toString()) }
    );
    await verifySessionPayment(
      jsonRequest('http://test/api/sessions/x/verify-payment', { verified: false }, { bearer: tutorTok }),
      { params: makeParams(session._id.toString()) }
    );
    const updated = await Session.findById(session._id);
    expect(updated?.tutorPaymentStatus).toBe('disputed');
  });
});

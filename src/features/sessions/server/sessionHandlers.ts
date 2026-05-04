import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

const createSessionSchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  scheduledAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  notes: z.string().optional(),
  duration: z.number().min(0.5).max(8).default(1.5),
});

const updateSessionSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed']),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});

export async function listSessions(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const filter = user.role === 'student' ? { student: user.userId } : { tutor: user.userId };

    const sessions = await Session.find(filter)
      .populate('student', 'name email profilePicture')
      .populate('tutor', 'name email profilePicture')
      .sort({ scheduledAt: 1 })
      .lean();

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('Session Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function createSession(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Unauthorized, only students can book sessions' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const parsed = createSessionSchema.parse(body);

    const tutor = await User.findOne({ _id: parsed.tutorId, role: 'tutor' });
    if (!tutor) {
      return NextResponse.json({ message: 'Tutor not found' }, { status: 404 });
    }

    const hourlyRate = tutor.tutorProfile?.hourlyRate || 500;
    const duration = parsed.duration || 1.5;
    const amount = Math.round(hourlyRate * duration);

    const session = await Session.create({
      student: user.userId,
      tutor: tutor._id,
      subject: parsed.subject,
      scheduledAt: new Date(parsed.scheduledAt),
      notes: parsed.notes,
      duration,
      hourlyRate,
      amount,
      paymentStatus: 'unpaid',
    });

    return NextResponse.json({ message: 'Session booked successfully', session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Session Book Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function updateSessionStatus(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'tutor') {
      return NextResponse.json({ message: 'Unauthorized, only tutors can update status' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const body = await request.json();
    const { status } = updateSessionSchema.parse(body);

    const session = await Session.findOne({ _id: id, tutor: user.userId });
    if (!session) {
      return NextResponse.json({ message: 'Session not found or unauthorized' }, { status: 404 });
    }

    session.status = status;
    if (status === 'completed') {
      session.completedAt = new Date();
    }
    await session.save();

    return NextResponse.json({ message: 'Session updated successfully', session }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Session Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function cancelSession(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    const isStudent = session.student.toString() === userToken.userId;
    const isTutor = session.tutor.toString() === userToken.userId;

    if (!isStudent && !isTutor) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (session.status === 'cancelled') {
      return NextResponse.json({ message: 'Session is already cancelled' }, { status: 400 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ message: 'Cannot cancel completed session' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = cancelSchema.parse(body);

    session.status = 'cancelled';
    session.cancelledBy = isTutor ? 'tutor' : 'student';
    session.cancellationReason = parsed.reason;
    session.cancelledAt = new Date();
    await session.save();

    if (isTutor) {
      const tutor = await User.findById(userToken.userId);
      if (tutor && tutor.tutorProfile) {
        tutor.tutorProfile.cancellationCount = (tutor.tutorProfile.cancellationCount || 0) + 1;

        const totalSessions = await Session.countDocuments({
          tutor: userToken.userId,
          status: { $in: ['accepted', 'completed', 'cancelled'] },
        });

        if (totalSessions > 0) {
          tutor.tutorProfile.cancellationRate =
            Math.round((tutor.tutorProfile.cancellationCount / totalSessions) * 100);
        }

        await tutor.save();
      }
    }

    return NextResponse.json({ message: 'Session cancelled successfully', session }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Session cancellation error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function reviewSession(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Only students can submit reviews' }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const body = await request.json();
    const { rating, review } = reviewSchema.parse(body);

    const session = await Session.findOne({ _id: id, student: user.userId });
    if (!session) {
      return NextResponse.json({ message: 'Session not found or unauthorized' }, { status: 404 });
    }

    if (session.status !== 'completed') {
      return NextResponse.json({ message: 'Only completed sessions can be reviewed' }, { status: 400 });
    }

    session.rating = rating;
    session.review = review;
    await session.save();

    const sessions = await Session.find({ tutor: session.tutor, rating: { $exists: true } });
    const avgRating = sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length;

    await User.updateOne(
      { _id: session.tutor },
      {
        'tutorProfile.averageRating': Number(avgRating.toFixed(1)),
        'tutorProfile.reviewCount': sessions.length,
      }
    );

    return NextResponse.json({ message: 'Review submitted successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Review Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function payForSession(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await resolveAuthToken(request);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Only students can make payments' }, { status: 403 });
    }

    await connectToDatabase();

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    if (session.student.toString() !== user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK
    }
    const { transactionId, paymentMethod } = body as { transactionId?: string; paymentMethod?: string };

    const amount = session.amount || Math.round((session.hourlyRate || 500) * (session.duration || 1.5));
    const platformFee = Math.round(amount * 0.15);
    const tutorEarnings = amount - platformFee;

    const payment = await Payment.create({
      sessionId: session._id,
      tutorId: session.tutor,
      studentId: user.userId,
      amount,
      platformFee,
      tutorEarnings,
      status: 'completed',
      paymentMethod: paymentMethod || 'jazzcash',
      transactionId: transactionId || `TXN${Date.now()}`,
      paidAt: new Date(),
    });

    session.paymentStatus = 'paid';
    session.paymentId = payment._id;
    session.transactionId = transactionId;
    session.paymentMethod = (paymentMethod as 'jazzcash' | 'easypaisa' | 'stripe' | 'bank_transfer') || 'jazzcash';
    session.paidAt = new Date();
    await session.save();

    return NextResponse.json(
      {
        message: 'Payment processed successfully',
        payment: {
          id: payment._id,
          amount,
          transactionId: payment.transactionId,
          status: 'completed',
        },
        session: {
          id: session._id,
          paymentStatus: session.paymentStatus,
          paidAt: session.paidAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session Payment Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function verifySessionPayment(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await resolveAuthToken(request);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'tutor') {
      return NextResponse.json({ message: 'Only tutors can verify payments' }, { status: 403 });
    }

    await connectToDatabase();

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    if (session.tutor.toString() !== user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (session.paymentStatus !== 'paid') {
      return NextResponse.json({ message: 'Session has not been paid yet' }, { status: 400 });
    }

    if (session.tutorPaymentStatus === 'verified') {
      return NextResponse.json({ message: 'Payment already verified' }, { status: 400 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK
    }
    const { verified } = body as { verified?: boolean; notes?: string };

    if (verified === false) {
      session.tutorPaymentStatus = 'disputed';
      await session.save();

      return NextResponse.json(
        {
          message: 'Payment disputed. Our team will review this.',
          session: {
            id: session._id,
            tutorPaymentStatus: session.tutorPaymentStatus,
          },
        },
        { status: 200 }
      );
    }

    session.tutorPaymentStatus = 'verified';
    session.tutorVerifiedAt = new Date();
    await session.save();

    return NextResponse.json(
      {
        message: 'Payment verified successfully',
        session: {
          id: session._id,
          paymentStatus: session.paymentStatus,
          tutorPaymentStatus: session.tutorPaymentStatus,
          tutorVerifiedAt: session.tutorVerifiedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getSessionPaymentStatus(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await resolveAuthToken(request);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    if (session.tutor.toString() !== user.userId && session.student.toString() !== user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(
      {
        session: {
          id: session._id,
          paymentStatus: session.paymentStatus,
          tutorPaymentStatus: session.tutorPaymentStatus,
          tutorVerifiedAt: session.tutorVerifiedAt,
          amount: session.amount,
          transactionId: session.transactionId,
          paidAt: session.paidAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment Status Check Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

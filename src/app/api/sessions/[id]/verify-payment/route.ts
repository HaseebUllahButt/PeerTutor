import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

// POST /api/sessions/[id]/verify-payment - Tutor verifies they received payment
export async function POST(
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

    // Verify the tutor owns this session
    if (session.tutor.toString() !== user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Verify the session is paid
    if (session.paymentStatus !== 'paid') {
      return NextResponse.json({ message: 'Session has not been paid yet' }, { status: 400 });
    }

    // Check if already verified
    if (session.tutorPaymentStatus === 'verified') {
      return NextResponse.json({ message: 'Payment already verified' }, { status: 400 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK
    }
    const { verified, notes } = body as { verified?: boolean; notes?: string };

    if (verified === false) {
      // Tutor is disputing the payment
      session.tutorPaymentStatus = 'disputed';
      await session.save();

      return NextResponse.json({
        message: 'Payment disputed. Our team will review this.',
        session: {
          id: session._id,
          tutorPaymentStatus: session.tutorPaymentStatus,
        },
      }, { status: 200 });
    }

    // Tutor confirms they received payment
    session.tutorPaymentStatus = 'verified';
    session.tutorVerifiedAt = new Date();
    await session.save();

    return NextResponse.json({
      message: 'Payment verified successfully',
      session: {
        id: session._id,
        paymentStatus: session.paymentStatus,
        tutorPaymentStatus: session.tutorPaymentStatus,
        tutorVerifiedAt: session.tutorVerifiedAt,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Payment Verification Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/sessions/[id]/verify-payment - Check verification status
export async function GET(
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

    // Verify the user is either the tutor or student for this session
    if (session.tutor.toString() !== user.userId && session.student.toString() !== user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      session: {
        id: session._id,
        paymentStatus: session.paymentStatus,
        tutorPaymentStatus: session.tutorPaymentStatus,
        tutorVerifiedAt: session.tutorVerifiedAt,
        amount: session.amount,
        transactionId: session.transactionId,
        paidAt: session.paidAt,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Payment Status Check Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

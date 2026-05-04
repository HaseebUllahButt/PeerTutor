import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import Payment from '@/models/Payment';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

// POST /api/sessions/[id]/pay - Process payment for a session
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
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Only students can make payments' }, { status: 403 });
    }

    await connectToDatabase();

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    // Verify the student owns this session
    if (session.student.toString() !== user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK, use defaults
    }
    const { transactionId, paymentMethod } = body as { transactionId?: string; paymentMethod?: string };

    // Calculate amounts
    const amount = session.amount || Math.round((session.hourlyRate || 500) * (session.duration || 1.5));
    const platformFee = Math.round(amount * 0.15);
    const tutorEarnings = amount - platformFee;

    // Create payment record
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

    // Update session with payment info
    session.paymentStatus = 'paid';
    session.paymentId = payment._id;
    session.transactionId = transactionId;
    session.paymentMethod = (paymentMethod as 'jazzcash' | 'easypaisa' | 'stripe' | 'bank_transfer') || 'jazzcash';
    session.paidAt = new Date();
    await session.save();

    return NextResponse.json({
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
    }, { status: 200 });

  } catch (error) {
    console.error('Session Payment Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

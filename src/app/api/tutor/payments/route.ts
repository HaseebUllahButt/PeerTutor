import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Payment from '@/models/Payment';
import Session from '@/models/Session';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'tutor') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = { tutorId: user.userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get payments with pagination
    const payments = await Payment.find(query)
      .populate({
        path: 'sessionId',
        select: 'subject scheduledAt duration status',
      })
      .populate({
        path: 'studentId',
        select: 'name email',
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    // Format payment data
    const formattedPayments = payments.map((p) => ({
      id: p._id,
      sessionId: p.sessionId?._id,
      sessionSubject: p.sessionId?.subject || 'Tutoring Session',
      sessionDate: p.sessionId?.scheduledAt,
      duration: p.sessionId?.duration || 1.5,
      studentName: p.studentId?.name || 'Student',
      studentEmail: p.studentId?.email,
      amount: p.amount,
      platformFee: p.platformFee,
      tutorEarnings: p.tutorEarnings,
      status: p.status,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    }));

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Payments Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST to create a mock payment (for testing)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, paymentMethod } = body;

    // Get session details
    const session = await Session.findById(sessionId)
      .populate('tutor', 'tutorProfile.hourlyRate')
      .populate('student', 'name email');

    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    // Calculate payment amount based on hourly rate and duration
    const hourlyRate = (session as any).tutor?.tutorProfile?.hourlyRate || 500;
    const duration = (session as any).duration || 1.5;
    const amount = Math.round(hourlyRate * duration);

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ sessionId });
    if (existingPayment) {
      return NextResponse.json({ 
        message: 'Payment already exists for this session',
        payment: existingPayment 
      }, { status: 400 });
    }

    // Create payment record
    const payment = await Payment.create({
      sessionId,
      tutorId: session.tutor,
      studentId: session.student,
      amount,
      platformFee: Math.round(amount * 0.15),
      tutorEarnings: Math.round(amount * 0.85),
      status: 'pending',
      paymentMethod: paymentMethod || 'jazzcash',
    });

    return NextResponse.json({
      message: 'Payment created successfully',
      payment: {
        id: payment._id,
        amount: payment.amount,
        tutorEarnings: payment.tutorEarnings,
        status: payment.status,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Payment Creation Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

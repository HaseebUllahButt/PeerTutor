import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Withdrawal from '@/models/Withdrawal';
import Session from '@/models/Session';
import Invoice from '@/models/Invoice';
import { verifyToken } from '@/lib/auth';

const profileSchema = z.object({
  bio: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  subjects: z.array(z.string()).optional(),
  schedule: z.object({
    mode: z.enum(['simple', 'advanced']),
    simpleSchedule: z.object({
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
    }).optional(),
    advancedSchedule: z.record(
      z.string(),
      z.object({
        startHour: z.number().min(0).max(23),
        endHour: z.number().min(0).max(23),
      })
    ).optional(),
  }).optional(),
  unavailableSlots: z.array(z.object({
    date: z.string(),
    hour: z.number().min(0).max(23),
  })).optional(),
});

const withdrawSchema = z.object({
  amount: z.number().min(1000, 'Minimum withdrawal amount is Rs. 1,000'),
  paymentMethod: z.enum(['jazzcash', 'easypaisa', 'bank_transfer']),
  jazzcashDetails: z.object({
    mobileNumber: z.string(),
    accountTitle: z.string(),
  }).optional(),
  easypaisaDetails: z.object({
    mobileNumber: z.string(),
    accountTitle: z.string(),
  }).optional(),
  bankDetails: z.object({
    accountTitle: z.string(),
    accountNumber: z.string(),
    bankName: z.string(),
    iban: z.string().optional(),
  }).optional(),
});

export async function updateTutorProfile(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken || userToken.role !== 'tutor') {
      return NextResponse.json({ message: 'Unauthorized, only tutors can update profile' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const parsed = profileSchema.parse(body);

    const user = await User.findById(userToken.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.tutorProfile) {
      user.tutorProfile = { subjects: [], hourlyRate: 0, bio: '', schedule: { mode: 'simple' } };
    }

    if (parsed.bio !== undefined) user.tutorProfile.bio = parsed.bio;
    if (parsed.hourlyRate !== undefined) user.tutorProfile.hourlyRate = parsed.hourlyRate;
    if (parsed.subjects !== undefined) user.tutorProfile.subjects = parsed.subjects;
    if (parsed.schedule !== undefined) {
      user.tutorProfile.schedule = parsed.schedule;
    }
    if (parsed.unavailableSlots !== undefined) {
      user.tutorProfile.unavailableSlots = parsed.unavailableSlots;
    }

    await user.save();

    return NextResponse.json({ message: 'Profile updated successfully', profile: user.tutorProfile }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Profile Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getTutorEarnings(request: Request) {
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

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const tutor = await User.findById(user.userId).select('tutorProfile.hourlyRate name');
    const hourlyRate = tutor?.tutorProfile?.hourlyRate || 500;

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const payments = await Payment.find({
      tutorId: user.userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 });

    const totalEarnings = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.tutorEarnings, 0);

    const pendingEarnings = payments
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.tutorEarnings, 0);

    const totalPlatformFees = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.platformFee, 0);

    const completedSessions = await Session.countDocuments({
      tutorId: user.userId,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate },
    });

    const pendingPayments = payments.filter((p) => p.status === 'pending').length;
    const completedPayments = payments.filter((p) => p.status === 'completed').length;

    const withdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: 'completed',
      processedAt: { $gte: startDate, $lte: endDate },
    });

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    const allCompletedPayments = await Payment.find({
      tutorId: user.userId,
      status: 'completed',
    });
    const allTimeEarnings = allCompletedPayments.reduce((sum, p) => sum + p.tutorEarnings, 0);

    const allWithdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: 'completed',
    });
    const allTimeWithdrawn = allWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = allTimeEarnings - allTimeWithdrawn;

    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const monthStart = startOfMonth(m);
      const monthEnd = endOfMonth(m);

      const monthPayments = await Payment.find({
        tutorId: user.userId,
        status: 'completed',
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });

      const monthWithdrawals = await Withdrawal.find({
        tutorId: user.userId,
        status: 'completed',
        processedAt: { $gte: monthStart, $lte: monthEnd },
      });

      const earnings = monthPayments.reduce((sum, p) => sum + p.tutorEarnings, 0);
      const withdrawn = monthWithdrawals.reduce((sum, w) => sum + w.amount, 0);

      monthlyBreakdown.push({
        month: format(m, 'MMM yyyy'),
        earnings,
        withdrawn,
        net: earnings - withdrawn,
      });
    }

    return NextResponse.json({
      summary: {
        totalEarnings,
        pendingEarnings,
        availableBalance,
        totalWithdrawn: totalWithdrawn,
        totalPlatformFees,
        hourlyRate,
        completedSessions,
        pendingPayments,
        completedPayments,
      },
      monthlyBreakdown,
      recentPayments: payments.slice(0, 10).map((p) => ({
        id: p._id,
        amount: p.tutorEarnings,
        status: p.status,
        date: p.createdAt,
        transactionId: p.transactionId,
      })),
    }, { status: 200 });

  } catch (error) {
    console.error('Earnings Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getTutorPayments(request: Request) {
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

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = { tutorId: user.userId };
    if (status && status !== 'all') {
      query.status = status;
    }

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

export async function createTutorPayment(request: Request) {
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

    await connectToDatabase();

    const body = await request.json();
    const { sessionId, paymentMethod } = body;

    const session = await Session.findById(sessionId)
      .populate('tutor', 'tutorProfile.hourlyRate')
      .populate('student', 'name email');

    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    const populatedSession = session as unknown as {
      tutor?: { tutorProfile?: { hourlyRate?: number } };
      duration?: number;
    };
    const hourlyRate = populatedSession.tutor?.tutorProfile?.hourlyRate || 500;
    const duration = populatedSession.duration || 1.5;
    const amount = Math.round(hourlyRate * duration);

    const existingPayment = await Payment.findOne({ sessionId });
    if (existingPayment) {
      return NextResponse.json({
        message: 'Payment already exists for this session',
        payment: existingPayment,
      }, { status: 400 });
    }

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

export async function getTutorInvoices(request: Request) {
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

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = user.role;

    const query: Record<string, unknown> = role === 'tutor'
      ? { tutorId: user.userId }
      : { studentId: user.userId };

    const invoices = await Invoice.find(query)
      .populate('paymentId', 'status transactionId')
      .populate('sessionId', 'subject scheduledAt duration')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    const formattedInvoices = invoices.map((inv) => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      createdAt: inv.createdAt,
      paidAt: inv.paidAt,
      sessionSubject: inv.sessionSubject,
      sessionDate: inv.sessionDate,
      duration: inv.sessionDuration,
      hourlyRate: inv.hourlyRate,
      subtotal: inv.subtotal,
      platformFee: inv.platformFee,
      totalAmount: inv.totalAmount,
      transactionId: inv.paymentId?.transactionId,
      pdfUrl: inv.pdfUrl,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Invoices Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function createTutorInvoice(request: Request) {
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

    await connectToDatabase();

    const body = await request.json();
    const { paymentId } = body;

    const existingInvoice = await Invoice.findOne({ paymentId });
    if (existingInvoice) {
      return NextResponse.json({
        message: 'Invoice already exists',
        invoice: existingInvoice,
      }, { status: 400 });
    }

    const payment = await Payment.findById(paymentId)
      .populate('sessionId', 'subject scheduledAt duration')
      .populate('tutorId', 'name')
      .populate('studentId', 'name email');

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    const sessionDuration = payment.sessionId?.duration || 1.5;
    const hourlyRate = Math.round(payment.amount / sessionDuration);
    const subtotal = payment.amount;
    const platformFee = payment.platformFee;
    const totalAmount = subtotal;

    const invoice = await Invoice.create({
      paymentId,
      sessionId: payment.sessionId,
      tutorId: payment.tutorId,
      studentId: payment.studentId,
      tutorName: payment.tutorId?.name || 'Tutor',
      studentName: payment.studentId?.name || 'Student',
      studentEmail: payment.studentId?.email || '',
      sessionSubject: payment.sessionId?.subject || 'Tutoring Session',
      sessionDate: payment.sessionId?.scheduledAt || new Date(),
      sessionDuration,
      hourlyRate,
      subtotal,
      platformFee,
      platformFeePercentage: 15,
      totalAmount,
      status: payment.status === 'completed' ? 'paid' : 'generated',
      paidAt: payment.paidAt,
    });

    return NextResponse.json({
      message: 'Invoice generated successfully',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        createdAt: invoice.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Invoice Generation Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getTutorWithdrawals() {
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

    await connectToDatabase();

    const completedPayments = await Payment.find({
      tutorId: user.userId,
      status: 'completed',
    });
    const totalEarnings = completedPayments.reduce((sum, p) => sum + p.tutorEarnings, 0);

    const completedWithdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: { $in: ['completed', 'processing'] },
    });
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = totalEarnings - totalWithdrawn;

    const pendingWithdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: 'pending',
    });
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const recentWithdrawals = await Withdrawal.find({
      tutorId: user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      availableBalance,
      pendingAmount,
      totalEarnings,
      totalWithdrawn,
      recentWithdrawals: recentWithdrawals.map((w) => ({
        id: w._id,
        reference: w.reference,
        amount: w.amount,
        status: w.status,
        paymentMethod: w.paymentMethod,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        transactionId: w.transactionId,
      })),
    }, { status: 200 });

  } catch (error) {
    console.error('Withdrawal Info Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function createTutorWithdrawal(request: Request) {
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

    await connectToDatabase();

    const body = await request.json();
    const parsed = withdrawSchema.parse(body);

    const completedPayments = await Payment.find({
      tutorId: user.userId,
      status: 'completed',
    });
    const totalEarnings = completedPayments.reduce((sum, p) => sum + p.tutorEarnings, 0);

    const completedWithdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: { $in: ['completed', 'processing', 'pending'] },
    });
    const totalWithdrawnOrPending = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = totalEarnings - totalWithdrawnOrPending;

    if (parsed.amount > availableBalance) {
      return NextResponse.json({
        message: 'Insufficient balance',
        availableBalance,
        requestedAmount: parsed.amount,
      }, { status: 400 });
    }

    if (parsed.paymentMethod === 'jazzcash' && !parsed.jazzcashDetails) {
      return NextResponse.json({ message: 'JazzCash details required' }, { status: 400 });
    }
    if (parsed.paymentMethod === 'easypaisa' && !parsed.easypaisaDetails) {
      return NextResponse.json({ message: 'Easypaisa details required' }, { status: 400 });
    }
    if (parsed.paymentMethod === 'bank_transfer' && !parsed.bankDetails) {
      return NextResponse.json({ message: 'Bank details required' }, { status: 400 });
    }

    const withdrawal = await Withdrawal.create({
      tutorId: user.userId,
      amount: parsed.amount,
      paymentMethod: parsed.paymentMethod,
      jazzcashDetails: parsed.jazzcashDetails,
      easypaisaDetails: parsed.easypaisaDetails,
      bankDetails: parsed.bankDetails,
      status: 'pending',
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        reference: withdrawal.reference,
        amount: withdrawal.amount,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod,
        createdAt: withdrawal.createdAt,
      },
      remainingBalance: availableBalance - parsed.amount,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: 'Validation error',
        errors: error.issues,
      }, { status: 400 });
    }
    console.error('Withdrawal Request Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

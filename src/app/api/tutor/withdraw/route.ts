import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Withdrawal from '@/models/Withdrawal';
import Payment from '@/models/Payment';
import { z } from 'zod';

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

// GET - Get available balance and withdrawal history
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

    // Calculate available balance
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

    // Get pending withdrawal amount
    const pendingWithdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: 'pending',
    });
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Get recent withdrawals
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

// POST - Create withdrawal request
export async function POST(request: Request) {
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

    const body = await request.json();
    const parsed = withdrawSchema.parse(body);

    // Calculate available balance
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

    // Check if sufficient balance
    if (parsed.amount > availableBalance) {
      return NextResponse.json({
        message: 'Insufficient balance',
        availableBalance,
        requestedAmount: parsed.amount,
      }, { status: 400 });
    }

    // Validate payment method details
    if (parsed.paymentMethod === 'jazzcash' && !parsed.jazzcashDetails) {
      return NextResponse.json({ message: 'JazzCash details required' }, { status: 400 });
    }
    if (parsed.paymentMethod === 'easypaisa' && !parsed.easypaisaDetails) {
      return NextResponse.json({ message: 'Easypaisa details required' }, { status: 400 });
    }
    if (parsed.paymentMethod === 'bank_transfer' && !parsed.bankDetails) {
      return NextResponse.json({ message: 'Bank details required' }, { status: 400 });
    }

    // Create withdrawal
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
        errors: (error as any).errors,
      }, { status: 400 });
    }
    console.error('Withdrawal Request Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

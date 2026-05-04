import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Payment from '@/models/Payment';
import Withdrawal from '@/models/Withdrawal';
import Session from '@/models/Session';
import User from '@/models/User';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Get tutor's hourly rate
    const tutor = await User.findById(user.userId).select('tutorProfile.hourlyRate name');
    const hourlyRate = tutor?.tutorProfile?.hourlyRate || 500;

    // Calculate date range
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    // Get all payments for this tutor
    const payments = await Payment.find({
      tutorId: user.userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 });

    // Calculate totals
    const totalEarnings = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.tutorEarnings, 0);

    const pendingEarnings = payments
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.tutorEarnings, 0);

    const totalPlatformFees = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.platformFee, 0);

    // Get completed sessions count
    const completedSessions = await Session.countDocuments({
      tutorId: user.userId,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate },
    });

    // Get pending/completed breakdown
    const pendingPayments = payments.filter((p) => p.status === 'pending').length;
    const completedPayments = payments.filter((p) => p.status === 'completed').length;

    // Get total withdrawals this month
    const withdrawals = await Withdrawal.find({
      tutorId: user.userId,
      status: 'completed',
      processedAt: { $gte: startDate, $lte: endDate },
    });

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Calculate available balance (total completed - total withdrawn)
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

    // Generate monthly breakdown for the last 6 months
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

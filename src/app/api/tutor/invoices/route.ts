import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import { format } from 'date-fns';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = user.role;

    // Build query based on role
    const query: any = role === 'tutor' ? { tutorId: user.userId } : { studentId: user.userId };

    // Get invoices with pagination
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

// POST - Generate invoice for a payment
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
    const { paymentId } = body;

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ paymentId });
    if (existingInvoice) {
      return NextResponse.json({
        message: 'Invoice already exists',
        invoice: existingInvoice,
      }, { status: 400 });
    }

    // Get payment details
    const payment = await Payment.findById(paymentId)
      .populate('sessionId', 'subject scheduledAt duration')
      .populate('tutorId', 'name')
      .populate('studentId', 'name email');

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    // Calculate session details
    const sessionDuration = payment.sessionId?.duration || 1.5;
    const hourlyRate = Math.round(payment.amount / sessionDuration);
    const subtotal = payment.amount;
    const platformFee = payment.platformFee;
    const totalAmount = subtotal;

    // Create invoice
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

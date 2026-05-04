/**
 * Mock Payment Data Seeding Script
 * This script creates realistic mock payment data for demonstration purposes.
 * Run with: npx ts-node scripts/seed-payments.ts
 */

import mongoose from 'mongoose';
import Payment from '../src/models/Payment';
import Withdrawal from '../src/models/Withdrawal';
import Invoice from '../src/models/Invoice';
import Session from '../src/models/Session';
import User from '../src/models/User';
import { subMonths, subDays, format } from 'date-fns';

// MongoDB connection string - update as needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/peertutor';

// Mock data configuration
const TUTOR_ID = 'your-tutor-id-here'; // Update with actual tutor ID
const STUDENT_IDS = ['student-1', 'student-2', 'student-3'];
const SESSION_IDS = ['session-1', 'session-2', 'session-3', 'session-4', 'session-5'];

// Helper to generate random amounts based on hourly rate
const generateSessionAmount = (hourlyRate: number, duration: number = 1.5) => {
  return Math.round(hourlyRate * duration);
};

// Create mock payments
const createMockPayments = async (tutorId: string) => {
  console.log('Creating mock payments...');
  
  const payments = [];
  const statuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = ['completed', 'completed', 'completed', 'pending', 'processing'];
  const methods: Array<'jazzcash' | 'easypaisa' | 'stripe'> = ['jazzcash', 'easypaisa', 'stripe', 'jazzcash', 'stripe'];
  
  for (let i = 0; i < 10; i++) {
    const createdAt = subDays(new Date(), i * 3);
    const hourlyRate = 500 + Math.floor(Math.random() * 500); // Rs. 500-1000
    const duration = 1 + Math.random() * 1.5; // 1-2.5 hours
    const amount = generateSessionAmount(hourlyRate, duration);
    const platformFee = Math.round(amount * 0.15);
    const tutorEarnings = amount - platformFee;
    
    const payment = {
      sessionId: new mongoose.Types.ObjectId(),
      tutorId: new mongoose.Types.ObjectId(tutorId),
      studentId: new mongoose.Types.ObjectId(),
      amount,
      platformFee,
      tutorEarnings,
      status: statuses[i % statuses.length],
      paymentMethod: methods[i % methods.length],
      transactionId: `TXN${Date.now()}${i}`,
      paidAt: statuses[i % statuses.length] === 'completed' ? createdAt : undefined,
      createdAt,
    };
    
    payments.push(payment);
  }
  
  // Insert payments
  for (const payment of payments) {
    await Payment.findOneAndUpdate(
      { transactionId: payment.transactionId },
      payment,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✅ Created ${payments.length} mock payments`);
  return payments;
};

// Create mock withdrawals
const createMockWithdrawals = async (tutorId: string) => {
  console.log('Creating mock withdrawals...');
  
  const withdrawals = [];
  const statuses: Array<'pending' | 'processing' | 'completed'> = ['completed', 'completed', 'completed', 'pending'];
  const methods: Array<'jazzcash' | 'easypaisa' | 'bank_transfer'> = ['jazzcash', 'easypaisa', 'bank_transfer', 'jazzcash'];
  
  for (let i = 0; i < 6; i++) {
    const createdAt = subDays(new Date(), i * 7 + 2);
    const amount = 2000 + Math.floor(Math.random() * 8000); // Rs. 2000-10000
    
    const withdrawal = {
      tutorId: new mongoose.Types.ObjectId(tutorId),
      amount,
      status: statuses[i % statuses.length],
      paymentMethod: methods[i % methods.length],
      [`${methods[i % methods.length]}Details`]: {
        mobileNumber: '03' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
        accountTitle: 'Demo Tutor Account',
      },
      reference: `WD-${format(createdAt, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      transactionId: statuses[i % statuses.length] === 'completed' ? `PAYOUT${Date.now()}${i}` : undefined,
      processedAt: statuses[i % statuses.length] === 'completed' ? subDays(createdAt, -1) : undefined,
      createdAt,
    };
    
    withdrawals.push(withdrawal);
  }
  
  // Insert withdrawals
  for (const withdrawal of withdrawals) {
    await Withdrawal.findOneAndUpdate(
      { reference: withdrawal.reference },
      withdrawal,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✅ Created ${withdrawals.length} mock withdrawals`);
  return withdrawals;
};

// Create mock invoices
const createMockInvoices = async (payments: any[]) => {
  console.log('Creating mock invoices...');
  
  const invoices = [];
  
  for (let i = 0; i < Math.min(payments.length, 8); i++) {
    const payment = payments[i];
    const createdAt = payment.createdAt;
    const sessionDate = subDays(createdAt, 1);
    const duration = 1 + Math.random() * 1.5;
    const hourlyRate = Math.round(payment.amount / duration);
    
    const invoice = {
      invoiceNumber: `INV-${format(createdAt, 'yyyyMM')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      paymentId: payment._id || new mongoose.Types.ObjectId(),
      sessionId: payment.sessionId,
      tutorId: payment.tutorId,
      studentId: payment.studentId,
      tutorName: 'Demo Tutor',
      studentName: 'Demo Student',
      studentEmail: 'student@example.com',
      sessionSubject: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'][i % 5],
      sessionDate,
      sessionDuration: duration,
      hourlyRate,
      subtotal: payment.amount,
      platformFee: payment.platformFee,
      platformFeePercentage: 15,
      totalAmount: payment.amount,
      status: payment.status === 'completed' ? 'paid' : 'generated',
      generatedAt: createdAt,
      sentAt: payment.status === 'completed' ? createdAt : undefined,
      paidAt: payment.status === 'completed' ? payment.paidAt : undefined,
      createdAt,
    };
    
    invoices.push(invoice);
  }
  
  // Insert invoices
  for (const invoice of invoices) {
    await Invoice.findOneAndUpdate(
      { invoiceNumber: invoice.invoiceNumber },
      invoice,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✅ Created ${invoices.length} mock invoices`);
  return invoices;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting mock payment data seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get a tutor from the database
    const tutor = await User.findOne({ role: 'tutor' });
    if (!tutor) {
      console.log('❌ No tutor found in database. Please create a tutor user first.');
      process.exit(1);
    }
    
    console.log(`Using tutor: ${tutor.name} (${tutor._id})\n`);
    
    // Clear existing mock data (optional - comment out if you want to keep existing)
    console.log('Clearing existing mock data...');
    await Payment.deleteMany({ 'tutorId': tutor._id });
    await Withdrawal.deleteMany({ 'tutorId': tutor._id });
    await Invoice.deleteMany({ 'tutorId': tutor._id });
    console.log('✅ Cleared existing mock data\n');
    
    // Create mock data
    const payments = await createMockPayments(tutor._id.toString());
    const withdrawals = await createMockWithdrawals(tutor._id.toString());
    const invoices = await createMockInvoices(payments);
    
    console.log('\n📊 Summary:');
    console.log(`   • Payments: ${payments.length}`);
    console.log(`   • Withdrawals: ${withdrawals.length}`);
    console.log(`   • Invoices: ${invoices.length}`);
    
    console.log('\n✨ Mock data seeding completed!');
    console.log('\nYou can now view the mock data in:');
    console.log('   • Earnings Dashboard: /dashboard/earnings');
    console.log('   • Invoices Page: /dashboard/invoices');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the seeding script
seedDatabase();

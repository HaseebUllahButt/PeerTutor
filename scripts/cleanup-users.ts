/**
 * Cleanup Script
 * This script removes all tutors and students from the database.
 * Run with: npx ts-node scripts/cleanup-users.ts
 */

import mongoose from 'mongoose';
import User from '../src/models/User';
import Session from '../src/models/Session';
import Payment from '../src/models/Payment';
import Withdrawal from '../src/models/Withdrawal';
import Invoice from '../src/models/Invoice';
import Message from '../src/models/Message';
import Conversation from '../src/models/Conversation';
import fs from 'fs';
import path from 'path';

// Manual .env loading
const envPath = path.resolve(__dirname, '../.env');
let MONGODB_URI = 'mongodb://localhost:27017/peertutor';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const match = envFile.match(/MONGODB_URI=(.*)/);
  if (match && match[1]) {
    MONGODB_URI = match[1].trim();
  }
}

const cleanupDatabase = async () => {
  try {
    console.log('🚀 Starting database cleanup...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // 1. Delete all students and tutors
    console.log('Deleting all tutors and students...');
    const userResult = await User.deleteMany({ role: { $in: ['student', 'tutor'] } });
    console.log(`✅ Deleted ${userResult.deletedCount} users (tutors & students)\n`);
    
    // 2. Delete related data
    console.log('Deleting related data (Sessions, Payments, Invoices, etc.)...');
    
    const sessionResult = await Session.deleteMany({});
    const paymentResult = await Payment.deleteMany({});
    const withdrawalResult = await Withdrawal.deleteMany({});
    const invoiceResult = await Invoice.deleteMany({});
    const messageResult = await Message.deleteMany({});
    const conversationResult = await Conversation.deleteMany({});
    
    console.log(`✅ Deleted ${sessionResult.deletedCount} sessions`);
    console.log(`✅ Deleted ${paymentResult.deletedCount} payments`);
    console.log(`✅ Deleted ${withdrawalResult.deletedCount} withdrawals`);
    console.log(`✅ Deleted ${invoiceResult.deletedCount} invoices`);
    console.log(`✅ Deleted ${messageResult.deletedCount} messages`);
    console.log(`✅ Deleted ${conversationResult.deletedCount} conversations\n`);
    
    console.log('✨ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the cleanup script
cleanupDatabase();

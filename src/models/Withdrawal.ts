import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  tutorId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank_transfer';
  bankDetails?: {
    accountTitle?: string;
    accountNumber?: string;
    bankName?: string;
    iban?: string;
  };
  jazzcashDetails?: {
    mobileNumber: string;
    accountTitle: string;
  };
  easypaisaDetails?: {
    mobileNumber: string;
    accountTitle: string;
  };
  transactionId?: string;
  processedAt?: Date;
  rejectionReason?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>({
  tutorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1000, // Minimum withdrawal: Rs. 1000
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'bank_transfer'],
    required: true,
  },
  bankDetails: {
    accountTitle: String,
    accountNumber: String,
    bankName: String,
    iban: String,
  },
  jazzcashDetails: {
    mobileNumber: String,
    accountTitle: String,
  },
  easypaisaDetails: {
    mobileNumber: String,
    accountTitle: String,
  },
  transactionId: {
    type: String,
    sparse: true,
  },
  processedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  reference: {
    type: String,
    unique: true,
    default: function() {
      return 'WD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    },
  },
}, {
  timestamps: true,
});

// Indexes
WithdrawalSchema.index({ tutorId: 1, status: 1 });
WithdrawalSchema.index({ createdAt: -1 });
WithdrawalSchema.index({ reference: 1 });

export default mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

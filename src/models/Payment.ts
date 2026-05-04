import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  sessionId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  amount: number;
  platformFee: number;
  tutorEarnings: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'jazzcash' | 'easypaisa' | 'stripe' | 'bank_transfer';
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  tutorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  platformFee: {
    type: Number,
    required: true,
    default: function(this: IPayment) {
      // 15% platform fee
      return Math.round(this.amount * 0.15);
    },
  },
  tutorEarnings: {
    type: Number,
    required: true,
    default: function(this: IPayment) {
      // 85% to tutor
      return Math.round(this.amount * 0.85);
    },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'stripe', 'bank_transfer'],
    required: true,
  },
  transactionId: {
    type: String,
    sparse: true,
  },
  paidAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
PaymentSchema.index({ tutorId: 1, status: 1 });
PaymentSchema.index({ sessionId: 1 }, { unique: true });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ transactionId: 1 }, { sparse: true });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

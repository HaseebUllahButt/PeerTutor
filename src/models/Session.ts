import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface ISession extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  subject: string;
  scheduledAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  notes?: string;
  rating?: number;
  review?: string;
  completedAt?: Date;
  cancelledBy?: 'student' | 'tutor';
  cancellationReason?: string;
  cancelledAt?: Date;
  // Payment fields
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: Types.ObjectId;
  amount?: number;
  duration?: number;
  hourlyRate?: number;
  paidAt?: Date;
  transactionId?: string;
  paymentMethod?: 'jazzcash' | 'easypaisa' | 'stripe' | 'bank_transfer';
  // Tutor payment verification
  tutorPaymentStatus?: 'pending' | 'verified' | 'disputed';
  tutorVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    completedAt: { type: Date },
    cancelledBy: { type: String, enum: ['student', 'tutor'] },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    // Payment fields
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    amount: { type: Number },
    duration: { type: Number, default: 1.5 }, // hours
    hourlyRate: { type: Number },
    paidAt: { type: Date },
    transactionId: { type: String },
    paymentMethod: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'stripe', 'bank_transfer'],
    },
    // Tutor payment verification
    tutorPaymentStatus: {
      type: String,
      enum: ['pending', 'verified', 'disputed'],
      default: 'pending',
    },
    tutorVerifiedAt: { type: Date },
  },
  { timestamps: true }
);

const Session: Model<ISession> = models.Session || model<ISession>('Session', sessionSchema);

export default Session;

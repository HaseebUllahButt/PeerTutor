import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  paymentId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  tutorName: string;
  studentName: string;
  studentEmail: string;
  sessionSubject: string;
  sessionDate: Date;
  sessionDuration: number; // in hours
  hourlyRate: number;
  subtotal: number;
  platformFee: number;
  platformFeePercentage: number;
  totalAmount: number;
  status: 'generated' | 'sent' | 'paid';
  generatedAt: Date;
  sentAt?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `INV-${year}${month}-${random}`;
    },
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
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
  tutorName: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  sessionSubject: {
    type: String,
    required: true,
  },
  sessionDate: {
    type: Date,
    required: true,
  },
  sessionDuration: {
    type: Number,
    required: true,
    default: 1.5, // 1.5 hours default
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  platformFeePercentage: {
    type: Number,
    default: 15,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['generated', 'sent', 'paid'],
    default: 'generated',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: {
    type: Date,
  },
  paidAt: {
    type: Date,
  },
  pdfUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
InvoiceSchema.index({ tutorId: 1, createdAt: -1 });
InvoiceSchema.index({ studentId: 1, createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ paymentId: 1 }, { unique: true });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

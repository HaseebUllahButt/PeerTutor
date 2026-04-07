import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface ISession extends Document {
  student: Types.ObjectId;
  tutor: Types.ObjectId;
  subject: string;
  scheduledAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  notes?: string;
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
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const Session: Model<ISession> = models.Session || model<ISession>('Session', sessionSchema);

export default Session;

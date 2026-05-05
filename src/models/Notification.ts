import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'session_complete'
  | 'new_message'
  | 'payment_received'
  | 'session_reminder';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'booking_request',
        'booking_accepted',
        'booking_declined',
        'booking_cancelled',
        'session_complete',
        'new_message',
        'payment_received',
        'session_reminder',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body:  { type: String, required: true },
    link:  { type: String },
    read:  { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

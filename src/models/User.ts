import { Schema, model, models, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'tutor' | 'admin';
  profilePicture?: string;
  tutorProfile?: {
    subjects: string[];
    hourlyRate: number;
    bio: string;
    averageRating?: number;
    reviewCount?: number;
    cancellationRate?: number;
    cancellationCount?: number;
    schedule: {
      mode: 'simple' | 'advanced';
      simpleSchedule?: {
        startHour: number;
        endHour: number;
      };
      advancedSchedule?: {
        Monday?: { startHour: number; endHour: number };
        Tuesday?: { startHour: number; endHour: number };
        Wednesday?: { startHour: number; endHour: number };
        Thursday?: { startHour: number; endHour: number };
        Friday?: { startHour: number; endHour: number };
        Saturday?: { startHour: number; endHour: number };
        Sunday?: { startHour: number; endHour: number };
      };
    };
    unavailableSlots?: Array<{
      date: string; // YYYY-MM-DD
      hour: number; // 0-23
    }>;
  };
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
    profilePicture: { type: String },
    tutorProfile: {
      subjects: { type: [String], default: [] },
      hourlyRate: { type: Number },
      bio: { type: String },
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 },
      cancellationCount: { type: Number, default: 0 },
      schedule: {
        mode: { type: String, enum: ['simple', 'advanced'], default: 'simple' },
        simpleSchedule: {
          startHour: { type: Number, min: 0, max: 23 },
          endHour: { type: Number, min: 0, max: 23 },
        },
        advancedSchedule: {
          Monday: { startHour: Number, endHour: Number },
          Tuesday: { startHour: Number, endHour: Number },
          Wednesday: { startHour: Number, endHour: Number },
          Thursday: { startHour: Number, endHour: Number },
          Friday: { startHour: Number, endHour: Number },
          Saturday: { startHour: Number, endHour: Number },
          Sunday: { startHour: Number, endHour: Number },
        },
      },
      unavailableSlots: [
        {
          date: { type: String }, // YYYY-MM-DD
          hour: { type: Number, min: 0, max: 23 },
        }
      ],
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to verify password
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User: Model<IUser> = models.User || model<IUser>('User', userSchema);

export default User;

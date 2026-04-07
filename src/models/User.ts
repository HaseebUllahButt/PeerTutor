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
    availability: string[];
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
      availability: { type: [String], default: [] },
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

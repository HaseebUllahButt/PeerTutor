import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const profileSchema = z.object({
  bio: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  subjects: z.array(z.string()).optional(),
  schedule: z.object({
    mode: z.enum(['simple', 'advanced']),
    simpleSchedule: z.object({
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
    }).optional(),
    advancedSchedule: z.record(
      z.string(),
      z.object({
        startHour: z.number().min(0).max(23),
        endHour: z.number().min(0).max(23),
      })
    ).optional(),
  }).optional(),
  unavailableSlots: z.array(z.object({
    date: z.string(),
    hour: z.number().min(0).max(23),
  })).optional(),
});

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken || userToken.role !== 'tutor') {
      return NextResponse.json({ message: 'Unauthorized, only tutors can update profile' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const parsed = profileSchema.parse(body);

    const user = await User.findById(userToken.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.tutorProfile) {
      user.tutorProfile = { subjects: [], hourlyRate: 0, bio: '', schedule: { mode: 'simple' } };
    }

    if (parsed.bio !== undefined) user.tutorProfile.bio = parsed.bio;
    if (parsed.hourlyRate !== undefined) user.tutorProfile.hourlyRate = parsed.hourlyRate;
    if (parsed.subjects !== undefined) user.tutorProfile.subjects = parsed.subjects;
    if (parsed.schedule !== undefined) {
      user.tutorProfile.schedule = parsed.schedule;
    }
    if (parsed.unavailableSlots !== undefined) {
      user.tutorProfile.unavailableSlots = parsed.unavailableSlots;
    }

    await user.save();

    return NextResponse.json({ message: 'Profile updated successfully', profile: user.tutorProfile }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Profile Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

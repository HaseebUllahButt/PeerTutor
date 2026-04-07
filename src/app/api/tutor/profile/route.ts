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
  availability: z.array(z.string()).optional(),
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
      user.tutorProfile = { subjects: [], hourlyRate: 0, bio: '', availability: [] };
    }

    if (parsed.bio !== undefined) user.tutorProfile.bio = parsed.bio;
    if (parsed.hourlyRate !== undefined) user.tutorProfile.hourlyRate = parsed.hourlyRate;
    if (parsed.subjects !== undefined) user.tutorProfile.subjects = parsed.subjects;
    if (parsed.availability !== undefined) user.tutorProfile.availability = parsed.availability;

    await user.save();

    return NextResponse.json({ message: 'Profile updated successfully', profile: user.tutorProfile }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Profile Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

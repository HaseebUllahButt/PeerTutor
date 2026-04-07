import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const tutors = await User.find({ role: 'tutor' })
      .select('name profilePicture tutorProfile createdAt')
      .lean();

    return NextResponse.json({ tutors }, { status: 200 });
  } catch (error) {
    console.error('Tutors Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

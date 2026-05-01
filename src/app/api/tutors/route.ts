import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse query params for filters
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const minRate = searchParams.get('minRate');
    const maxRate = searchParams.get('maxRate');

    // Build filter object
    const filter: any = { role: 'tutor' };
    if (subject) {
      filter['tutorProfile.subjects'] = { $regex: subject, $options: 'i' };
    }
    if (minRate || maxRate) {
      filter['tutorProfile.hourlyRate'] = {};
      if (minRate) filter['tutorProfile.hourlyRate'].$gte = Number(minRate);
      if (maxRate) filter['tutorProfile.hourlyRate'].$lte = Number(maxRate);
    }

    const tutors = await User.find(filter)
      .select('name profilePicture tutorProfile createdAt')
      .lean();

    return NextResponse.json({ tutors }, { status: 200 });
  } catch (error) {
    console.error('Tutors Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

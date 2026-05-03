import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

export async function GET(request: Request) {
  try {
    const token = await resolveAuthToken(request);

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select('name email role profilePicture tutorProfile');

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const tutorProfile = user.tutorProfile ?? payload.tutorProfile;

    return NextResponse.json({
      userId: payload.userId,
      role: user.role,
      name: user.name,
      email: user.email,
      tutorProfile,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        tutorProfile,
      },
    });
  } catch (error) {
    console.error('Auth ME Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

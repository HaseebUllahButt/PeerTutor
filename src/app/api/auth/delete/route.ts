import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    // Delete all sessions related to this user (as student or tutor)
    await Session.deleteMany({
      $or: [{ student: payload.userId }, { tutor: payload.userId }],
    });

    // Delete the user
    const result = await User.findByIdAndDelete(payload.userId);

    if (!result) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Clear the token cookie
    const response = NextResponse.json({ message: 'Account deleted successfully' });
    response.cookies.set('token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Account Deletion Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

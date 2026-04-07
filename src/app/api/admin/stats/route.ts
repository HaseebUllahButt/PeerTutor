import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken || userToken.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized, admin only' }, { status: 403 });
    }

    await connectToDatabase();

    const totalUsers = await User.countDocuments();
    const activeTutors = await User.countDocuments({ role: 'tutor' });
    const totalSessions = await Session.countDocuments();
    const recentSignups = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');

    return NextResponse.json({ 
      stats: { totalUsers, activeTutors, totalSessions, openReports: 0 },
      recentSignups 
    }, { status: 200 });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

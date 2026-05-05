import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

// PATCH /api/notifications/read — mark all (or specific) notifications as read
export async function PATCH(request: Request) {
  try {
    const token = await resolveAuthToken(request);
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    let ids: string[] | undefined;
    try {
      const body = await request.json();
      ids = body.ids;
    } catch {
      // no body = mark all
    }

    const filter = ids?.length
      ? { user: user.userId, _id: { $in: ids } }
      : { user: user.userId, read: false };

    await Notification.updateMany(filter, { $set: { read: true } });

    return NextResponse.json({ message: 'Marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Notification Read Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

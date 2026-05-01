import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateSessionSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'tutor') {
      return NextResponse.json({ message: 'Unauthorized, only tutors can update status' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const body = await request.json();
    const { status } = updateSessionSchema.parse(body);

    const session = await Session.findOne({ _id: id, tutor: user.userId });
    if (!session) {
      return NextResponse.json({ message: 'Session not found or unauthorized' }, { status: 404 });
    }

    session.status = status;
    if (status === 'completed') {
      session.completedAt = new Date();
    }
    await session.save();

    return NextResponse.json({ message: 'Session updated successfully', session }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Session Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

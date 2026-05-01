import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const cancelSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    // Check if user is student or tutor in this session
    const isStudent = session.student.toString() === userToken.userId;
    const isTutor = session.tutor.toString() === userToken.userId;

    if (!isStudent && !isTutor) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (session.status === 'cancelled') {
      return NextResponse.json(
        { message: 'Session is already cancelled' },
        { status: 400 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { message: 'Cannot cancel completed session' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = cancelSchema.parse(body);

    // Update session
    session.status = 'cancelled';
    session.cancelledBy = isTutor ? 'tutor' : 'student';
    session.cancellationReason = parsed.reason;
    session.cancelledAt = new Date();
    await session.save();

    // If tutor cancelled, update their cancellation rate
    if (isTutor) {
      const tutor = await User.findById(userToken.userId);
      if (tutor && tutor.tutorProfile) {
        tutor.tutorProfile.cancellationCount = (tutor.tutorProfile.cancellationCount || 0) + 1;
        
        // Calculate cancellation rate: cancellations / total sessions (accepted + completed)
        const totalSessions = await Session.countDocuments({
          tutor: userToken.userId,
          status: { $in: ['accepted', 'completed', 'cancelled'] }
        });

        if (totalSessions > 0) {
          tutor.tutorProfile.cancellationRate =
            Math.round((tutor.tutorProfile.cancellationCount / totalSessions) * 100);
        }

        await tutor.save();
      }
    }

    return NextResponse.json(
      { message: 'Session cancelled successfully', session },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Session cancellation error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

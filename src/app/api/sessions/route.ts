import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createSessionSchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  scheduledAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    // Students see sessions where they are the student
    // Tutors see sessions where they are the tutor
    const filter = user.role === 'student' ? { student: user.userId } : { tutor: user.userId };
    
    const sessions = await Session.find(filter)
      .populate('student', 'name email profilePicture')
      .populate('tutor', 'name email profilePicture')
      .sort({ scheduledAt: 1 })
      .lean();

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('Session Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Unauthorized, only students can book sessions' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const parsed = createSessionSchema.parse(body);

    const tutor = await User.findOne({ _id: parsed.tutorId, role: 'tutor' });
    if (!tutor) {
      return NextResponse.json({ message: 'Tutor not found' }, { status: 404 });
    }

    const session = await Session.create({
      student: user.userId,
      tutor: tutor._id,
      subject: parsed.subject,
      scheduledAt: new Date(parsed.scheduledAt),
      notes: parsed.notes,
    });

    return NextResponse.json({ message: 'Session booked successfully', session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || zodErr.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Session Book Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

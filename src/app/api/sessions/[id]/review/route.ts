import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Session from '@/models/Session';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ message: 'Only students can submit reviews' }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const body = await request.json();
    const { rating, review } = reviewSchema.parse(body);

    const session = await Session.findOne({ _id: id, student: user.userId });
    if (!session) {
      return NextResponse.json({ message: 'Session not found or unauthorized' }, { status: 404 });
    }

    if (session.status !== 'completed') {
      return NextResponse.json({ message: 'Only completed sessions can be reviewed' }, { status: 400 });
    }

    session.rating = rating;
    session.review = review;
    await session.save();

    // Update tutor's average rating
    const sessions = await Session.find({ tutor: session.tutor, rating: { $exists: true } });
    const avgRating = sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length;

    await User.updateOne(
      { _id: session.tutor },
      {
        'tutorProfile.averageRating': Number(avgRating.toFixed(1)),
        'tutorProfile.reviewCount': sessions.length,
      }
    );

    return NextResponse.json({ message: 'Review submitted successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodErr = error as any;
      return NextResponse.json(
        { message: zodErr.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Review Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

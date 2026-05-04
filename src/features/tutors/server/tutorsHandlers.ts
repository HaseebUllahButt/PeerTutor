import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { verifyToken } from '@/lib/auth';
import { generateAvailableSlots, isSlotBooked } from '@/lib/availability';

export async function listTutors(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const minRate = searchParams.get('minRate');
    const maxRate = searchParams.get('maxRate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { role: 'tutor' };
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

export async function getTutor(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const tutor = await User.findOne({ _id: id, role: 'tutor' })
      .select('name profilePicture tutorProfile email');

    if (!tutor) {
      return NextResponse.json({ message: 'Tutor not found' }, { status: 404 });
    }

    return NextResponse.json({ tutor }, { status: 200 });
  } catch (error) {
    console.error('Tutor Fetch Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getTutorSlots(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const tutor = await User.findById(id);

    if (!tutor || tutor.role !== 'tutor') {
      return NextResponse.json(
        { message: 'Tutor not found' },
        { status: 404 }
      );
    }

    const bookedSessions = await Session.find({
      tutor: id,
      status: { $in: ['accepted', 'pending'] },
    });

    const availableSlots = generateAvailableSlots(tutor, 30);

    const openSlots = availableSlots.filter(slot =>
      !isSlotBooked(slot.date, slot.hour, bookedSessions)
    );

    return NextResponse.json({
      slots: openSlots,
      tutorName: tutor.name,
      hourlyRate: tutor.tutorProfile?.hourlyRate,
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { message: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}

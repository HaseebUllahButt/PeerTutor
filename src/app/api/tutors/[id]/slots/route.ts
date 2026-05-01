import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { NextRequest, NextResponse } from 'next/server';
import { generateAvailableSlots, isSlotBooked } from '@/lib/availability';

export async function GET(
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

    // Get tutor's booked sessions
    const bookedSessions = await Session.find({
      tutor: id,
      status: { $in: ['accepted', 'pending'] }
    });

    // Generate available slots for next 30 days
    const availableSlots = generateAvailableSlots(tutor, 30);

    // Filter out booked slots
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

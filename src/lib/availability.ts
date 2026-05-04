import { IUser } from '@/models/User';

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  time: string; // "HH:00"
}

export function generateAvailableSlots(
  tutor: IUser,
  daysAhead: number = 30
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule = tutor.tutorProfile?.schedule;
  if (!schedule) return [];

  const unavailableSet = new Set(
    tutor.tutorProfile?.unavailableSlots?.map(u => `${u.date}-${u.hour}`) || []
  );

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }) as
      | 'Monday'
      | 'Tuesday'
      | 'Wednesday'
      | 'Thursday'
      | 'Friday'
      | 'Saturday'
      | 'Sunday';
    
    const dateStr = date.toISOString().split('T')[0];

    let startHour = 0;
    let endHour = 0;

    if (schedule.mode === 'simple' && schedule.simpleSchedule) {
      startHour = schedule.simpleSchedule.startHour;
      endHour = schedule.simpleSchedule.endHour;
    } else if (schedule.mode === 'advanced' && schedule.advancedSchedule) {
      const daySchedule = schedule.advancedSchedule[dayName];
      if (!daySchedule) continue; // Day not available
      startHour = daySchedule.startHour;
      endHour = daySchedule.endHour;
    } else {
      continue;
    }

    // Generate hourly slots for this day
    for (let hour = startHour; hour < endHour; hour++) {
      const slotKey = `${dateStr}-${hour}`;
      
      // Skip if tutor blocked this slot
      if (!unavailableSet.has(slotKey)) {
        slots.push({
          date: dateStr,
          hour,
          time: `${String(hour).padStart(2, '0')}:00`,
        });
      }
    }
  }

  return slots;
}

export function isSlotBooked(
  slotDate: string,
  slotHour: number,
  bookedSessions: Array<{ scheduledAt: string | Date }>
): boolean {
  return bookedSessions.some(session => {
    const sessionDate = new Date(session.scheduledAt);
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    const sessionHour = sessionDate.getHours();

    return sessionDateStr === slotDate && sessionHour === slotHour;
  });
}

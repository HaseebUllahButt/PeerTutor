import { describe, it, expect } from 'vitest';
import { generateAvailableSlots, isSlotBooked } from '@/lib/availability';
import type { IUser } from '@/models/User';

interface SimpleOpts {
  startHour?: number;
  endHour?: number;
  unavailable?: Array<{ date: string; hour: number }>;
}
function makeTutor(opts: SimpleOpts = {}): IUser {
  return {
    tutorProfile: {
      subjects: ['Math'],
      hourlyRate: 1000,
      bio: '',
      schedule: {
        mode: 'simple',
        simpleSchedule: {
          startHour: opts.startHour ?? 9,
          endHour: opts.endHour ?? 12,
        },
      },
      unavailableSlots: opts.unavailable ?? [],
    },
  } as unknown as IUser;
}
function makeAdvancedTutor(advanced: NonNullable<NonNullable<IUser['tutorProfile']>['schedule']>['advancedSchedule']): IUser {
  return {
    tutorProfile: {
      subjects: ['Math'],
      hourlyRate: 1000,
      bio: '',
      schedule: { mode: 'advanced', advancedSchedule: advanced },
      unavailableSlots: [],
    },
  } as unknown as IUser;
}

describe('generateAvailableSlots — SCRUM-12 (1-hour minimum slots, recurring weekly)', () => {
  it('returns empty array if tutor has no schedule', () => {
    const tutor = { tutorProfile: undefined } as unknown as IUser;
    expect(generateAvailableSlots(tutor, 7)).toEqual([]);
  });

  it('generates hourly slots in simple-schedule mode', () => {
    const tutor = makeTutor();
    const slots = generateAvailableSlots(tutor, 1);
    // 9, 10, 11 = 3 slots (endHour is exclusive)
    expect(slots).toHaveLength(3);
    expect(slots.map((s) => s.hour)).toEqual([9, 10, 11]);
    expect(slots[0].time).toBe('09:00');
  });

  it('formats hour as zero-padded HH:00', () => {
    const tutor = makeTutor({ startHour: 8, endHour: 9 });
    const slots = generateAvailableSlots(tutor, 1);
    expect(slots[0].time).toBe('08:00');
  });

  it('excludes slots in tutor unavailable list', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];

    const tutor = makeTutor({
      unavailable: [{ date: dateStr, hour: 10 }],
    });
    const slots = generateAvailableSlots(tutor, 1);
    expect(slots.find((s) => s.date === dateStr && s.hour === 10)).toBeUndefined();
    expect(slots).toHaveLength(2);
  });

  it('respects per-day schedule in advanced mode', () => {
    const tutor = makeAdvancedTutor({
      Monday: { startHour: 14, endHour: 16 },
      Tuesday: { startHour: 10, endHour: 11 },
    });
    const slots = generateAvailableSlots(tutor, 14);

    // Every slot's hour must fall in either the Monday range (14, 15)
    // or the Tuesday hour (10). Days not in the schedule should be skipped.
    for (const s of slots) {
      expect([10, 14, 15]).toContain(s.hour);
    }
    // We should have some slots over 14 days.
    expect(slots.length).toBeGreaterThan(0);
  });

  it('looks ahead the requested number of days', () => {
    const tutor = makeTutor({ startHour: 9, endHour: 10 });
    const sevenDays = generateAvailableSlots(tutor, 7);
    const oneDay = generateAvailableSlots(tutor, 1);
    expect(sevenDays.length).toBe(7);
    expect(oneDay.length).toBe(1);
  });
});

describe('isSlotBooked', () => {
  it('matches when same date and hour', () => {
    const date = new Date('2026-06-15T14:00:00');
    expect(
      isSlotBooked('2026-06-15', 14, [{ scheduledAt: date.toISOString() }])
    ).toBe(true);
  });

  it('returns false when no matching session', () => {
    expect(isSlotBooked('2026-06-15', 14, [])).toBe(false);
    expect(
      isSlotBooked('2026-06-15', 14, [{ scheduledAt: '2026-06-16T14:00:00' }])
    ).toBe(false);
  });

  it('does not match a different hour on the same day', () => {
    expect(
      isSlotBooked('2026-06-15', 14, [{ scheduledAt: '2026-06-15T15:00:00' }])
    ).toBe(false);
  });
});

'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface AvailableSlot {
  date: string;
  hour: number;
  time: string;
}

interface BookingCalendarProps {
  tutorId: string;
  onDateTimeSelect: (datetime: string) => void;
}

export default function BookingCalendar({ tutorId, onDateTimeSelect }: BookingCalendarProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await fetch(`/api/tutors/${tutorId}/slots`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
          
          // Extract unique dates for calendar highlighting
          const dates = new Set<string>(data.slots.map((s: AvailableSlot) => s.date));
          setAvailableDates(dates);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    if (tutorId) {
      fetchSlots();
    }
  }, [tutorId]);

  const handleDateSelect = (value: any) => {
    if (value instanceof Date) {
      setDate(value);
      setSelectedSlot(null);
      
      // Get slots for this date
      const dateStr = value.toISOString().split('T')[0];
      const daySlots = slots.filter(s => s.date === dateStr);
      
      // If there's at least one slot, pre-select the first one
      if (daySlots.length > 0) {
        setSelectedSlot(daySlots[0]);
      }
    }
  };

  const handleConfirm = () => {
    if (date && selectedSlot) {
      const datetime = new Date(date);
      datetime.setHours(selectedSlot.hour, 0, 0, 0);
      onDateTimeSelect(datetime.toISOString());
      setDate(null);
      setSelectedSlot(null);
    }
  };

  const dateStr = date ? date.toISOString().split('T')[0] : null;
  const slotsForSelectedDate = dateStr ? slots.filter(s => s.date === dateStr) : [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
          Select Date
        </label>
        {slotsLoading ? (
          <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Loading availability...</p>
        ) : (
          <div className="border rounded-lg p-4 inline-block" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)' }}>
            <Calendar
              onChange={handleDateSelect}
              value={date}
              minDate={new Date()}
              tileDisabled={({ date: tileDate }) => {
                const tileStr = tileDate.toISOString().split('T')[0];
                return !availableDates.has(tileStr);
              }}
              className="react-calendar-custom"
            />
          </div>
        )}
        <style jsx>{`
          .react-calendar-custom {
            font-family: var(--font-sans);
            border: none;
            background: transparent;
          }
          .react-calendar-custom button {
            color: var(--color-ink);
          }
          .react-calendar-custom button:enabled:hover {
            background-color: var(--color-gold-pale);
          }
          .react-calendar-custom .react-calendar__tile--active {
            background-color: var(--color-gold);
            color: var(--color-canvas);
          }
          .react-calendar-custom .react-calendar__tile--disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
        `}</style>
      </div>

      {date && (
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
            Available Times
          </label>
          {slotsForSelectedDate.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              No available slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {slotsForSelectedDate.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className="px-3 py-2 text-sm font-semibold rounded-lg border transition-all"
                  style={{
                    backgroundColor: selectedSlot?.time === slot.time ? 'var(--color-gold)' : 'var(--color-paper)',
                    borderColor: selectedSlot?.time === slot.time ? 'var(--color-gold)' : 'var(--color-border)',
                    color: selectedSlot?.time === slot.time ? 'var(--color-ink)' : 'var(--color-ink-50)',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedSlot}
            className="w-full px-4 py-2 font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-emerald)', color: 'white', fontFamily: 'var(--font-sans)' }}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

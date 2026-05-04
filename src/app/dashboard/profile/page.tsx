'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell';

interface UnavailableSlot {
  date: string;
  hour: number;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [user, setUser] = useState<null | {
    name: string;
    email: string;
    role: string;
    tutorProfile?: {
      bio?: string;
      hourlyRate?: number;
      subjects?: string[];
      schedule?: {
        mode?: 'simple' | 'advanced';
        simpleSchedule?: { startHour?: number; endHour?: number };
        advancedSchedule?: Record<string, { startHour: number; endHour: number }>;
      };
      averageRating?: number;
      reviewCount?: number;
      cancellationRate?: number;
      cancellationCount?: number;
      unavailableSlots?: UnavailableSlot[];
    };
  }>(null);
  const [message, setMessage] = useState('');
  
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(500);
  const [subjectsStr, setSubjectsStr] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'simple' | 'advanced'>('simple');
  const [simpleStart, setSimpleStart] = useState(9);
  const [simpleEnd, setSimpleEnd] = useState(17);
  const [advancedSchedule, setAdvancedSchedule] = useState<Record<string, { startHour: number; endHour: number }>>({});
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user.tutorProfile) {
            setBio(data.user.tutorProfile.bio || '');
            setHourlyRate(data.user.tutorProfile.hourlyRate || 500);
            setSubjectsStr(data.user.tutorProfile.subjects?.join(', ') || '');
            
            const schedule = data.user.tutorProfile.schedule;
            if (schedule) {
              setScheduleMode(schedule.mode || 'simple');
              if (schedule.simpleSchedule) {
                setSimpleStart(schedule.simpleSchedule.startHour || 9);
                setSimpleEnd(schedule.simpleSchedule.endHour || 17);
              }
              if (schedule.advancedSchedule) {
                setAdvancedSchedule(schedule.advancedSchedule);
              }
            }

            setUnavailableSlots(data.user.tutorProfile.unavailableSlots || []);
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const subjects = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);

    const payload: {
      bio: string;
      hourlyRate: number;
      subjects: string[];
      schedule: {
        mode: 'simple' | 'advanced';
        simpleSchedule?: { startHour: number; endHour: number };
        advancedSchedule?: Record<string, { startHour: number; endHour: number }>;
      };
      unavailableSlots: UnavailableSlot[];
    } = {
      bio,
      hourlyRate: Number(hourlyRate),
      subjects,
      schedule: {
        mode: scheduleMode,
      },
      unavailableSlots,
    };

    if (scheduleMode === 'simple') {
      payload.schedule.simpleSchedule = {
        startHour: simpleStart,
        endHour: simpleEnd,
      };
    } else {
      payload.schedule.advancedSchedule = advancedSchedule;
    }

    try {
      const res = await fetch('/api/tutor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.message || 'Error occurred');
      }
    } catch {
      setMessage('Internal Server Error');
    }
    setLoading(false);
  };

  return (
    <>
      {!user ? (
        <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>Loading...</p>
        </div>
      ) : (
        <DashboardShell
          user={user}
          navItems={[
            { label: 'Schedule', href: '/dashboard', icon: '📅' },
            { label: 'My Students', href: '/dashboard/students', icon: '🎓' },
            { label: 'Requests', href: '/dashboard/requests', icon: '📥' },
            { label: 'Earnings', href: '/dashboard/earnings', icon: '💰' },
            { label: 'Profile', href: '/dashboard/profile', icon: '👤' },
          ]}
        >
          <div className="max-w-3xl mx-auto space-y-6" style={{ animation: 'fade-up 0.5s ease both' }}>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Profile Settings
            </h1>

            {pageLoading ? (
              <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>Loading...</p>
            ) : (
              <>
                {/* Stats Cards */}
                {user?.tutorProfile && (
                  <div className="grid grid-cols-3 gap-4">
                    {/* Average Rating */}
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Average Rating</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
                        {user.tutorProfile.averageRating ? `${user.tutorProfile.averageRating}★` : 'No ratings'}
                      </p>
                      {user.tutorProfile.reviewCount && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)' }}>
                          ({user.tutorProfile.reviewCount} reviews)
                        </p>
                      )}
                    </div>

                    {/* Cancellation Rate */}
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Cancellation Rate</p>
                      <p className="text-2xl font-bold" style={{ color: typeof user.tutorProfile.cancellationRate === 'number' && user.tutorProfile.cancellationRate > 20 ? '#c0392b' : 'var(--color-emerald)', fontFamily: 'var(--font-display)' }}>
                        {typeof user.tutorProfile.cancellationRate === 'number' ? `${user.tutorProfile.cancellationRate}%` : 'N/A'}
                      </p>
                      {typeof user.tutorProfile.cancellationCount === 'number' && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)' }}>
                          ({user.tutorProfile.cancellationCount} cancellations)
                        </p>
                      )}
                    </div>

                    {/* Sessions Count */}
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Total Sessions</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                        {user.tutorProfile.reviewCount ? user.tutorProfile.reviewCount : '0'}
                      </p>
                    </div>
                  </div>
                )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Basic Info */}
                <div className="p-6 rounded-xl border shadow-sm space-y-5" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Basic Info</h2>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                      Brief Bio
                    </label>
                    <textarea
                      required
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={4}
                      placeholder="Describe your experience..."
                      className="w-full px-4 py-3 border rounded-lg outline-none transition-all"
                      style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--color-gold)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                      Hourly Rate (Rs)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={hourlyRate}
                      onChange={e => setHourlyRate(Number(e.target.value))}
                      className="w-full px-4 py-3 border rounded-lg outline-none transition-all"
                      style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--color-gold)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                      Subjects (Comma separated)
                    </label>
                    <input
                      required
                      type="text"
                      value={subjectsStr}
                      onChange={e => setSubjectsStr(e.target.value)}
                      placeholder="Math, Physics, Java..."
                      className="w-full px-4 py-3 border rounded-lg outline-none transition-all"
                      style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--color-gold)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                  </div>
                </div>

                {/* Schedule Mode Toggle */}
                <div className="p-6 rounded-xl border shadow-sm space-y-4" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                    Availability
                  </h2>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setScheduleMode('simple')}
                      className="flex-1 py-2 px-4 font-semibold rounded-lg border-2 transition-all"
                      style={{
                        backgroundColor: scheduleMode === 'simple' ? 'var(--color-gold)' : 'transparent',
                        borderColor: scheduleMode === 'simple' ? 'var(--color-gold)' : 'var(--color-border)',
                        color: scheduleMode === 'simple' ? 'var(--color-ink)' : 'var(--color-ink-50)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Simple Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('advanced')}
                      className="flex-1 py-2 px-4 font-semibold rounded-lg border-2 transition-all"
                      style={{
                        backgroundColor: scheduleMode === 'advanced' ? 'var(--color-gold)' : 'transparent',
                        borderColor: scheduleMode === 'advanced' ? 'var(--color-gold)' : 'var(--color-border)',
                        color: scheduleMode === 'advanced' ? 'var(--color-ink)' : 'var(--color-ink-50)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Advanced Mode
                    </button>
                  </div>

                  {/* Simple Mode */}
                  {scheduleMode === 'simple' && (
                    <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        Set the same hours for every day of the week
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                            Start Hour
                          </label>
                          <select
                            value={simpleStart}
                            onChange={e => setSimpleStart(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg outline-none"
                            style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
                          >
                            {hours.map(h => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                            End Hour
                          </label>
                          <select
                            value={simpleEnd}
                            onChange={e => setSimpleEnd(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg outline-none"
                            style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
                          >
                            {hours.map(h => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advanced Mode */}
                  {scheduleMode === 'advanced' && (
                    <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        Set different hours for each day
                      </p>
                      <div className="space-y-3">
                        {days.map(day => (
                          <div key={day} className="flex gap-2 items-end p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                            <div className="flex-1">
                              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink-80)', fontFamily: 'var(--font-sans)' }}>
                                {day}
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={advancedSchedule[day]?.startHour || ''}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setAdvancedSchedule({
                                      ...advancedSchedule,
                                      [day]: { ...advancedSchedule[day], startHour: val },
                                    });
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border rounded outline-none"
                                  style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)' }}
                                >
                                  <option value="">Start</option>
                                  {hours.map(h => (
                                    <option key={h} value={h}>
                                      {String(h).padStart(2, '0')}:00
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={advancedSchedule[day]?.endHour || ''}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setAdvancedSchedule({
                                      ...advancedSchedule,
                                      [day]: { ...advancedSchedule[day], endHour: val },
                                    });
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border rounded outline-none"
                                  style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)' }}
                                >
                                  <option value="">End</option>
                                  {hours.map(h => (
                                    <option key={h} value={h}>
                                      {String(h).padStart(2, '0')}:00
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newSchedule = { ...advancedSchedule };
                                delete newSchedule[day];
                                setAdvancedSchedule(newSchedule);
                              }}
                              className="px-3 py-1 text-sm font-semibold rounded transition-all hover:opacity-70"
                              style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}
                            >
                              Clear
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Blocked Hours */}
                <div className="p-6 rounded-xl border shadow-sm space-y-4" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                    Block Hours
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Block specific hours when you&apos;re not available
                  </p>

                  <div className="space-y-2">
                    {unavailableSlots.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        No blocked hours
                      </p>
                    ) : (
                      unavailableSlots.map((slot, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'var(--color-paper)' }}>
                          <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}>
                            {slot.date} at {String(slot.hour).padStart(2, '0')}:00
                          </span>
                          <button
                            type="button"
                            onClick={() => setUnavailableSlots(unavailableSlots.filter((_, i) => i !== idx))}
                            className="text-xs font-semibold px-2 py-1 rounded transition-all hover:opacity-70"
                            style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
                    <input
                      type="date"
                      id="block-date"
                      className="flex-1 px-3 py-2 text-sm border rounded outline-none"
                      style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)' }}
                    />
                    <select
                      id="block-hour"
                      className="flex-1 px-3 py-2 text-sm border rounded outline-none"
                      style={{ borderColor: 'var(--color-border)', fontFamily: 'var(--font-sans)' }}
                    >
                      <option value="">Hour</option>
                      {hours.map(h => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const date = (document.getElementById('block-date') as HTMLInputElement)?.value;
                        const hour = parseInt((document.getElementById('block-hour') as HTMLSelectElement)?.value || '-1');
                        if (date && hour >= 0) {
                          if (!unavailableSlots.some(s => s.date === date && s.hour === hour)) {
                            setUnavailableSlots([...unavailableSlots, { date, hour }]);
                            (document.getElementById('block-date') as HTMLInputElement).value = '';
                            (document.getElementById('block-hour') as HTMLSelectElement).value = '';
                          }
                        }
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded transition-all hover:opacity-90"
                      style={{ backgroundColor: 'var(--color-emerald)', color: 'white', fontFamily: 'var(--font-sans)' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {message && (
                  <p className="text-sm font-medium px-3 py-2 rounded" style={{ backgroundColor: message.includes('success') ? 'rgba(26,107,82,0.1)' : 'rgba(192,57,43,0.1)', color: message.includes('success') ? 'var(--color-emerald)' : 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
                    {message}
                  </p>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-3 font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
              </>
            )}
          </div>
        </DashboardShell>
      )}
    </>
  );
}

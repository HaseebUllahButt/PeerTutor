'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BookingCalendar from '@/components/BookingCalendar';

interface TutorProfile {
  subjects?: string[];
  bio?: string;
  averageRating?: number;
  reviewCount?: number;
  cancellationRate?: number;
  hourlyRate?: number;
}

interface Tutor {
  _id: string;
  name: string;
  tutorProfile?: TutorProfile;
}

type BookingStep = 'datetime' | 'review';
type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating';

export default function SearchPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  const [subject, setSubject] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bookingStep, setBookingStep] = useState<BookingStep>('datetime');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All subjects');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tutorsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/tutors'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (tutorsRes.ok) {
          const tutorsData = await tutorsRes.json();
          if (tutorsData.tutors) setTutors(tutorsData.tutors);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const uniqueSubjects = Array.from(
    new Set(
      tutors.flatMap((tutor) => tutor.tutorProfile?.subjects ?? []).filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const visibleTutors = tutors
    .filter((tutor) => {
      const query = searchQuery.trim().toLowerCase();
      const subjects = tutor.tutorProfile?.subjects ?? [];
      const matchesQuery =
        query.length === 0 ||
        tutor.name.toLowerCase().includes(query) ||
        (tutor.tutorProfile?.bio ?? '').toLowerCase().includes(query) ||
        subjects.some((topic) => topic.toLowerCase().includes(query));

      const matchesSubject =
        selectedSubjectFilter === 'All subjects' || subjects.includes(selectedSubjectFilter);

      return matchesQuery && matchesSubject;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') {
        return (a.tutorProfile?.hourlyRate ?? 500) - (b.tutorProfile?.hourlyRate ?? 500);
      }
      if (sortBy === 'price-high') {
        return (b.tutorProfile?.hourlyRate ?? 500) - (a.tutorProfile?.hourlyRate ?? 500);
      }
      if (sortBy === 'rating') {
        return (b.tutorProfile?.averageRating ?? 0) - (a.tutorProfile?.averageRating ?? 0);
      }
      return (b.tutorProfile?.reviewCount ?? 0) - (a.tutorProfile?.reviewCount ?? 0);
    });

  const averageRate = tutors.length
    ? Math.round(
        tutors.reduce((sum, tutor) => sum + (tutor.tutorProfile?.hourlyRate ?? 500), 0) / tutors.length
      )
    : 0;

  const openBookingModal = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setSubject('');
    setSelectedDateTime(null);
    setBookingStep('datetime');
    setMessage('');
  };

  const closeBookingModal = () => {
    setSelectedTutor(null);
    setSubject('');
    setSelectedDateTime(null);
    setBookingStep('datetime');
    setMessage('');
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bookingStep === 'datetime') {
      if (!selectedDateTime || !subject) {
        setMessage('Please select a time and subject');
        return;
      }
      setBookingStep('review');
      return;
    }

    if (!selectedTutor || !selectedDateTime) {
      setMessage('Please complete all booking details');
      return;
    }

    setBookingLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: selectedTutor._id,
          subject: subject.trim(),
          scheduledAt: selectedDateTime,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Session successfully requested!');
        setTimeout(() => {
          closeBookingModal();
        }, 2000);
      } else {
        setMessage(data.message || 'Error occurred');
      }
    } catch(err) {
      setMessage('Internal Server Error');
    }
    setBookingLoading(false);
  };

  return (
    <>
      {!user ? (
        <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>Loading...</p>
        </div>
      ) : (
        <DashboardShell user={user} navItems={[
          { label: 'Overview', href: '/dashboard', icon: '⌂' },
          { label: 'Search Tutors', href: '/dashboard/search', icon: '🔍' },
          { label: 'My Sessions', href: '/dashboard/sessions', icon: '📅' },
          { label: 'Messages', href: '/dashboard/messages', icon: '✉' },
          { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
        ]}>
          <div className="max-w-6xl mx-auto space-y-6" style={{ animation: 'fade-up 0.55s ease both' }}>
            <section
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: 'var(--color-border)',
                background:
                  'radial-gradient(circle at 10% 10%, rgba(181,136,58,0.17), transparent 34%), radial-gradient(circle at 88% 82%, rgba(26,107,82,0.14), transparent 30%), linear-gradient(135deg, var(--color-canvas), #fefbf6)',
              }}
            >
              <div className="p-6 md:p-8">
                <p
                  className="text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                >
                  Student Discovery
                </p>
                <h1
                  className="text-3xl md:text-4xl font-bold mt-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                >
                  Find a Tutor Who Fits Your Learning Style
                </h1>
                <p
                  className="text-sm md:text-base mt-3 max-w-3xl"
                  style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                >
                  Search by topic, compare rates instantly, and lock in a slot without bouncing through cluttered screens.
                </p>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(12,13,15,0.85)' }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Tutors Available</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#ffffff', fontFamily: 'var(--font-display)' }}>{tutors.length}</p>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(181,136,58,0.14)' }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-ink-50)' }}>Avg Hourly Rate</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>Rs. {averageRate}</p>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(26,107,82,0.12)' }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-ink-50)' }}>Filtered Results</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>{visibleTutors.length}</p>
                  </div>
                </div>
              </div>
            </section>

            <section
              className="rounded-2xl border p-5 md:p-6"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: 'var(--color-ink-50)' }}>
                    Search by name, subject, or bio
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Try: calculus, python, writing, exam prep"
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: 'var(--color-ink-50)' }}>
                    Sort
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Highest rated</option>
                    <option value="price-low">Lowest price</option>
                    <option value="price-high">Highest price</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectFilter('All subjects')}
                  className="px-3 py-1.5 text-xs rounded-full border transition-all"
                  style={{
                    borderColor: selectedSubjectFilter === 'All subjects' ? 'var(--color-gold)' : 'var(--color-border)',
                    color: selectedSubjectFilter === 'All subjects' ? 'var(--color-ink)' : 'var(--color-ink-50)',
                    backgroundColor: selectedSubjectFilter === 'All subjects' ? 'var(--color-gold-pale)' : 'var(--color-canvas)',
                  }}
                >
                  All subjects
                </button>
                {uniqueSubjects.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(topic)}
                    className="px-3 py-1.5 text-xs rounded-full border transition-all"
                    style={{
                      borderColor: selectedSubjectFilter === topic ? 'var(--color-gold)' : 'var(--color-border)',
                      color: selectedSubjectFilter === topic ? 'var(--color-ink)' : 'var(--color-ink-50)',
                      backgroundColor: selectedSubjectFilter === topic ? 'var(--color-gold-pale)' : 'var(--color-canvas)',
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </section>

            {loading ? (
              <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>Loading tutors...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleTutors.map((tutor) => (
                  <article
                    key={tutor._id}
                    className="rounded-2xl border overflow-hidden flex flex-col"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}
                  >
                    <div
                      className="px-5 pt-5 pb-4"
                      style={{
                        background:
                          'linear-gradient(145deg, rgba(181,136,58,0.1), rgba(255,255,255,0) 60%), linear-gradient(180deg, #fffdf9 0%, #ffffff 100%)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                            {tutor.name}
                          </h2>
                          <p className="text-xs mt-1 font-semibold uppercase tracking-widest" style={{ color: 'var(--color-emerald)' }}>
                            {(tutor.tutorProfile?.subjects ?? []).slice(0, 2).join(' • ') || 'General support'}
                          </p>
                        </div>
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}
                        >
                          {tutor.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 flex-1 flex flex-col">
                      <div>
                        <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: 'var(--color-ink-50)' }}>
                          {tutor.tutorProfile?.bio || 'Experienced tutor ready to help you succeed.'}
                        </p>
                        <div className="mt-4 flex gap-3 text-xs flex-wrap">
                          {tutor.tutorProfile?.averageRating && (
                            <span className="px-2 py-1 rounded-md" style={{ color: 'var(--color-ink-50)', backgroundColor: 'var(--color-paper)' }}>
                              ★ {tutor.tutorProfile.averageRating} ({tutor.tutorProfile.reviewCount || 0})
                            </span>
                          )}
                          {typeof tutor.tutorProfile?.cancellationRate === 'number' && (
                            <span
                              className="px-2 py-1 rounded-md"
                              style={{
                                color: tutor.tutorProfile.cancellationRate > 20 ? 'var(--color-danger)' : 'var(--color-ink-50)',
                                backgroundColor: 'var(--color-paper)',
                              }}
                            >
                              Cancel rate: {tutor.tutorProfile.cancellationRate}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                          Rs. {tutor.tutorProfile?.hourlyRate || 500}/hr
                        </p>
                        <button
                          onClick={() => openBookingModal(tutor)}
                          className="px-4 py-2 text-sm font-semibold rounded-lg transition-transform hover:-translate-y-0.5"
                          style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                        >
                          Book Session
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {visibleTutors.length === 0 && (
                  <div className="col-span-full rounded-2xl border py-14 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
                    <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                      No tutors match your filters
                    </h3>
                    <p className="text-sm mt-2" style={{ color: 'var(--color-ink-50)' }}>
                      Try a broader subject or clear your search query.
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedTutor && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4" 
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={closeBookingModal}
              >
                <div
                  className="rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden"
                  style={{ backgroundColor: 'var(--color-canvas)', animation: 'fade-up 0.3s ease both' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 md:p-6 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)' }}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--color-ink-50)' }}>
                          Guided Booking
                        </p>
                        <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                          {selectedTutor.name}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)' }}>
                          Choose your topic and a slot, then send the request.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-semibold"
                          style={{
                            color: bookingStep === 'datetime' ? 'var(--color-ink)' : 'var(--color-ink-50)',
                            backgroundColor: bookingStep === 'datetime' ? 'var(--color-gold-pale)' : 'rgba(12,13,15,0.06)',
                          }}
                        >
                          1. Select
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full font-semibold"
                          style={{
                            color: bookingStep === 'review' ? 'var(--color-ink)' : 'var(--color-ink-50)',
                            backgroundColor: bookingStep === 'review' ? 'var(--color-gold-pale)' : 'rgba(12,13,15,0.06)',
                          }}
                        >
                          2. Review
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={closeBookingModal}
                        className="transition-opacity hover:opacity-60 flex-shrink-0" 
                        style={{ color: 'var(--color-ink-50)', fontSize: '24px' }}
                      >
                        ✖
                      </button>
                    </div>
                    
                    <div className="mt-4 flex gap-4 flex-wrap">
                      {selectedTutor.tutorProfile?.averageRating && (
                        <div className="flex items-center gap-2">
                          <span style={{ color: 'var(--color-gold)', fontSize: '16px' }}>★</span>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {selectedTutor.tutorProfile.averageRating}
                            <span style={{ color: 'var(--color-ink-50)' }}> ({selectedTutor.tutorProfile.reviewCount || 0})</span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                          Rs. {selectedTutor.tutorProfile?.hourlyRate || 500}
                          <span style={{ color: 'var(--color-ink-50)' }}>/hr</span>
                        </span>
                      </div>
                      {typeof selectedTutor.tutorProfile?.cancellationRate === 'number' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: selectedTutor.tutorProfile.cancellationRate > 20 ? '#c0392b' : 'var(--color-emerald)' }}>
                            {selectedTutor.tutorProfile.cancellationRate}% cancel rate
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleBook} className="p-5 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
                      <div className="space-y-6">
                        {bookingStep === 'datetime' ? (
                          <>
                            <div>
                              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                                What do you want to study?
                              </label>
                              <input
                                required
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Data Structures, Calculus, Grammar"
                                maxLength={100}
                                className="w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm"
                                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                                onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                              />
                              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)' }}>{subject.length}/100</p>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                                Pick your time slot
                              </label>
                              <BookingCalendar
                                tutorId={selectedTutor._id}
                                onDateTimeSelect={(dt) => {
                                  setSelectedDateTime(dt);
                                  setMessage('');
                                }}
                              />
                            </div>

                            {subject && selectedDateTime && (
                              <div className="p-4 rounded-xl border-2" style={{ borderColor: 'var(--color-emerald)', backgroundColor: 'rgba(26,107,82,0.06)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-emerald)' }}>
                                  Ready to review your booking
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)' }}>
                                  {subject} | {new Date(selectedDateTime).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-paper)' }}>
                              <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: 'var(--color-ink-50)' }}>Session details</p>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                  <span style={{ color: 'var(--color-ink-50)' }}>Subject</span>
                                  <span className="text-right font-semibold" style={{ color: 'var(--color-ink)' }}>{subject}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span style={{ color: 'var(--color-ink-50)' }}>Date and time</span>
                                  <span className="text-right font-semibold" style={{ color: 'var(--color-ink)' }}>
                                    {selectedDateTime ? new Date(selectedDateTime).toLocaleString() : 'Pending'}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                  <span style={{ color: 'var(--color-ink-50)' }}>Duration</span>
                                  <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>1 hour</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(181,136,58,0.11)' }}>
                              <p className="text-sm" style={{ color: 'var(--color-ink-80)' }}>
                                After submitting, your tutor has up to 24 hours to accept or decline this request.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <aside className="rounded-xl border p-4 h-fit" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
                        <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--color-ink-50)' }}>Booking summary</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
                            {selectedTutor.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{selectedTutor.name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-ink-50)' }}>
                              {(selectedTutor.tutorProfile?.subjects ?? []).slice(0, 3).join(', ') || 'General support'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-ink-50)' }}>Rate</span>
                            <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>
                              Rs. {selectedTutor.tutorProfile?.hourlyRate || 500}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span style={{ color: 'var(--color-ink-50)' }}>Selected slot</span>
                            <span className="text-right font-semibold" style={{ color: 'var(--color-ink)' }}>
                              {selectedDateTime ? new Date(selectedDateTime).toLocaleString() : 'Not chosen'}
                            </span>
                          </div>
                        </div>
                      </aside>
                    </div>

                    {message && (
                      <p className="text-sm font-medium px-4 py-3 rounded-lg mt-5" style={{
                        backgroundColor: message.includes('successfully') ? 'rgba(26,107,82,0.1)' : 'rgba(192,57,43,0.1)',
                        color: message.includes('successfully') ? 'var(--color-emerald)' : 'var(--color-danger)',
                      }}>
                        {message}
                      </p>
                    )}

                    <div className="flex gap-3 pt-5">
                      {bookingStep === 'review' && (
                        <button
                          type="button"
                          onClick={() => setBookingStep('datetime')}
                          className="flex-1 px-4 py-3 font-semibold rounded-lg transition-all hover:opacity-90 border"
                          style={{
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-50)',
                          }}
                          disabled={bookingLoading}
                        >
                          Back
                        </button>
                      )}
                      <button 
                        disabled={bookingLoading || (bookingStep === 'datetime' && (!selectedDateTime || !subject))} 
                        type="submit" 
                        className="flex-1 py-3 font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                        style={{ 
                          backgroundColor: 'var(--color-ink)', 
                          color: 'var(--color-canvas)', 
                          cursor: (bookingLoading || (bookingStep === 'datetime' && (!selectedDateTime || !subject))) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {bookingLoading ? 'Submitting...' : bookingStep === 'datetime' ? 'Review Booking' : 'Confirm & Send Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </DashboardShell>
      )}
    </>
  );
}

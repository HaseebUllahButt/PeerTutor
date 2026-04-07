'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function SearchPage() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null);
  
  // Booking Form State
  const [subject, setSubject] = useState('');
  const [datetime, setDatetime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/tutors')
      .then(res => res.json())
      .then(data => {
        if (data.tutors) setTutors(data.tutors);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Mock User Payload for DashboardShell temporarily since client page doesn't receive it easily directly
  // We can just rely on the layout, but actually in Next.js `DashboardShell` requires the user.
  // Wait, `DashboardShell` is usually rendered by the `page.tsx` directly currently.
  // We need to fetch the current user to pass to DashboardShell if we use it here.
  // It's better to fetch user from an endpoint or just rely on global context.
  // For MVP, we'll fetch a dummy or rely on session if we had one. Let's make a quick `/api/auth/me` or just pass it differently.
  // Actually, we can just use `DashboardShell` without user, or make user optional?
  // Let's create an `/api/auth/me` to get current user details for client pages.
  const [user, setUser] = useState<any>({ name: 'Student', role: 'student', email: '' });
  
  // A quick workaround to fetch user state for shell.
  // Normally, layout.tsx handles DashboardShell. Wait! Does `app/dashboard/page.tsx` render DashboardShell?
  // Yes, `src/components/dashboard/StudentDashboard.tsx` renders `DashboardShell`.

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: selectedTutor._id,
          subject,
          scheduledAt: new Date(datetime).toISOString(),
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Session successfully requested!');
        setTimeout(() => setSelectedTutor(null), 2000);
      } else {
        setMessage(data.message || 'Error occurred');
      }
    } catch(err) {
      setMessage('Internal Server Error');
    }
    setBookingLoading(false);
  };

  return (
    <DashboardShell user={user} navItems={[
      { label: 'Overview', href: '/dashboard', icon: '⌂' },
      { label: 'Search Tutors', href: '/dashboard/search', icon: '🔍' },
      { label: 'My Sessions', href: '/dashboard/sessions', icon: '📅' },
      { label: 'Messages', href: '/dashboard/messages', icon: '✉' },
      { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
    ]}>
      <div className="max-w-5xl mx-auto space-y-6" style={{ animation: 'fade-up 0.5s ease both' }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
          Tutor Directory
        </h1>
        <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
          Find the perfect tutor and book a session today.
        </p>

        {loading ? (
          <p>Loading tutors...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {tutors.map(tutor => (
              <div key={tutor._id} className="p-5 rounded-xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                 <div>
                   <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{tutor.name}</h2>
                   <p className="text-xs font-semibold mb-3 text-emerald-600 uppercase tracking-widest">{tutor.tutorProfile?.subjects?.join(', ') || 'General'}</p>
                   <p className="text-sm line-clamp-3 text-gray-600 font-sans leading-relaxed">{tutor.tutorProfile?.bio || 'Experienced tutor ready to help you succeed.'}</p>
                 </div>
                 <div className="mt-5 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                   <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                     ${tutor.tutorProfile?.hourlyRate || 15}/hr
                   </p>
                   <button 
                     onClick={() => { setSelectedTutor(tutor); setSubject(''); setDatetime(''); setMessage(''); }}
                     className="px-4 py-2 text-sm font-semibold rounded-lg bg-black text-white hover:-translate-y-0.5 transition-transform"
                   >
                     Book Now
                   </button>
                 </div>
              </div>
            ))}
            {tutors.length === 0 && <p>No tutors available yet.</p>}
          </div>
        )}

        {/* Booking Modal */}
        {selectedTutor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" style={{ animation: 'fade-up 0.3s ease both' }}>
              <div className="p-6 border-b flex justify-between items-center">
                 <h3 className="text-xl font-bold font-display">Book Session with {selectedTutor.name}</h3>
                 <button onClick={() => setSelectedTutor(null)} className="text-gray-400 hover:text-black">✖</button>
              </div>
              <form onSubmit={handleBook} className="p-6 space-y-4">
                 <div>
                   <label className="block text-sm font-semibold mb-1">Subject</label>
                   <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"/>
                 </div>
                 <div>
                   <label className="block text-sm font-semibold mb-1">Date & Time</label>
                   <input required type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"/>
                 </div>
                 {message && <p className="text-sm font-medium text-amber-600">{message}</p>}
                 <button disabled={bookingLoading} type="submit" className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50">
                    {bookingLoading ? 'Requesting...' : 'Submit Request'}
                 </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

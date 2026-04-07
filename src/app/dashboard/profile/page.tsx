'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(15);
  const [subjectsStr, setSubjectsStr] = useState('');
  
  // Dummy user object for shell layout since layout doesn't pass it here inherently
  const user = { name: 'Tutor Profile', role: 'tutor', email: '' };

  useEffect(() => {
    // In a real scenario we'd fetch the existing profile, but since we only have PATCH /api/tutor/profile
    // we could add a GET or just start empty. Wait, GET /api/tutors could provide it, or we rely on them entering it afresh.
    // For MVP, we'll just let them override since we omitted the GET /api/tutor/profile for simplicity.
    setInitialLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const subjects = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/tutor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, hourlyRate: Number(hourlyRate), subjects })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.message || 'Error occurred');
      }
    } catch(err) {
      setMessage('Internal Server Error');
    }
    setLoading(false);
  };

  return (
    <DashboardShell user={user} navItems={[
      { label: 'Schedule', href: '/dashboard', icon: '📅' },
      { label: 'My Students', href: '/dashboard/students', icon: '🎓' },
      { label: 'Requests', href: '/dashboard/requests', icon: '📥' },
      { label: 'Earnings', href: '/dashboard/earnings', icon: '💰' },
      { label: 'Profile', href: '/dashboard/profile', icon: '👤' },
    ]}>
      <div className="max-w-2xl mx-auto space-y-6" style={{ animation: 'fade-up 0.5s ease both' }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
          Profile Settings
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
          Update your public tutor profile visible to students.
        </p>

        {initialLoading ? <p>Loading...</p> : (
          <form onSubmit={handleSave} className="p-6 rounded-xl border shadow-sm space-y-5 bg-white">
             <div>
               <label className="block text-sm font-semibold mb-1">Brief Bio</label>
               <textarea required value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Describe your experience..." className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"/>
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1">Hourly Rate ($)</label>
               <input required type="number" min="0" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"/>
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1">Subjects (Comma separated)</label>
               <input required type="text" value={subjectsStr} onChange={e => setSubjectsStr(e.target.value)} placeholder="Math, Physics, Java..." className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"/>
             </div>

             {message && <p className="text-sm font-medium text-emerald-600 border p-3 rounded bg-emerald-50">{message}</p>}

             <button disabled={loading} type="submit" className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : 'Save Profile'}
             </button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}

'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';
import CancellationModal from '@/components/CancellationModal';
import RatingModal from '@/components/RatingModal';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '⌂' },
  { label: 'Search Tutors', href: '/dashboard/search', icon: '' },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: '' },
  { label: 'Messages', href: '/dashboard/messages', icon: '' },
  { label: 'Settings', href: '/dashboard/settings', icon: '' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef9ee', text: '#c47c10' },
  accepted:  { bg: '#edfaf3', text: '#1a7a45' },
  declined:  { bg: '#fef2f2', text: '#c0392b' },
  completed: { bg: '#f0f4ff', text: '#3b5bdb' },
  cancelled: { bg: '#fef2f2', text: '#c0392b' },
};

export default function SessionsPageClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(false);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); setLoading(false); });
  }, []);

  const handleCancelClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedSessionId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        setSelectedSessionId(null);
        // Refresh sessions
        const data = await fetch('/api/sessions').then(r => r.json());
        if (data.sessions) setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
    } finally {
      setCancelling(false);
    }
  };

  const handleRatingClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingValue: number, review: string) => {
    if (!selectedSessionId) return;
    setRating(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue, review }),
      });
      if (res.ok) {
        setShowRatingModal(false);
        setSelectedSessionId(null);
        // Refresh sessions
        const data = await fetch('/api/sessions').then(r => r.json());
        if (data.sessions) setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Rating error:', error);
    } finally {
      setRating(false);
    }
  };

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  return (
    <>
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>My Sessions</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>All your booked tutoring sessions</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: filter === f ? 'var(--color-ink)' : 'var(--color-canvas)',
                  color: filter === f ? 'var(--color-canvas)' : 'var(--color-ink-50)',
                  border: `1px solid ${filter === f ? 'var(--color-ink)' : 'var(--color-border)'}`,
                  fontFamily: 'var(--font-sans)',
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          {loading ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading sessions...</div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>No {filter === 'all' ? '' : filter} sessions yet.</p>
            </div>
           ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
               {filtered.map(s => {
                 const sc = statusColors[s.status] ?? { bg: '#f5f5f5', text: '#555' };
                 const canCancel = ['pending', 'accepted'].includes(s.status);
                 const canRate = s.status === 'completed' && !s.rating;
                 return (
                   <div key={s._id} className="flex items-center gap-4 px-6 py-4">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}>
                       {s.tutor?.name?.substring(0, 2).toUpperCase() || 'TU'}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{s.subject}</p>
                       <p className="text-xs truncate" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>with {s.tutor?.name ?? 'Tutor'}</p>
                     </div>
                     <div className="text-right flex-shrink-0 space-y-1">
                       <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{new Date(s.scheduledAt).toLocaleString()}</p>
                       <div className="flex items-center gap-2 justify-end flex-wrap">
                         <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>{s.status}</span>
                         {s.rating && (
                           <span className="text-[10px] font-semibold text-yellow-600">★ {s.rating}</span>
                         )}
                         {canRate && (
                           <button
                             onClick={() => handleRatingClick(s._id)}
                             className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-90"
                             style={{ backgroundColor: '#fffaed', color: '#d97706', border: '1px solid #fcd34d' }}
                           >
                             Rate
                           </button>
                         )}
                         {canCancel && (
                           <button
                             onClick={() => handleCancelClick(s._id)}
                             className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-80"
                             style={{ backgroundColor: '#fef2f2', color: '#c0392b', border: '1px solid #f0bcbc' }}
                           >
                             Cancel
                           </button>
                          )}
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
       {showCancelModal && (
         <CancellationModal
           isOpen={showCancelModal}
           onClose={() => { setShowCancelModal(false); setSelectedSessionId(null); }}
           onConfirm={handleCancelConfirm}
           loading={cancelling}
         />
       )}
       {showRatingModal && (
         <RatingModal
           isOpen={showRatingModal}
           onClose={() => { setShowRatingModal(false); setSelectedSessionId(null); }}
           onSubmit={handleRatingSubmit}
           loading={rating}
         />
       )}
    </>
  );
}

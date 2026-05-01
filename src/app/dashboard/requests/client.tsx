'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';
import CancellationModal from '@/components/CancellationModal';

const navItems = [
  { label: 'Schedule',    href: '/dashboard',          icon: '' },
  { label: 'My Students', href: '/dashboard/students', icon: '' },
  { label: 'Requests',    href: '/dashboard/requests', icon: '' },
  { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
  { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
];

export default function RequestsClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchSessions = () => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); setLoading(false); });
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleAction = async (id: string, status: 'accepted' | 'declined') => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchSessions();
  };

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
        fetchSessions();
      }
    } catch (error) {
      console.error('Cancellation error:', error);
    } finally {
      setCancelling(false);
    }
  };

  const handleCompleteClick = async (id: string) => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    fetchSessions();
  };

  const pending = sessions.filter(s => s.status === 'pending');
  const history = sessions.filter(s => s.status !== 'pending');

  return (
    <>
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Session Requests</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Review and respond to incoming booking requests</p>
        </div>

        {/* Pending */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Pending</h2>
            {pending.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9ee', color: '#c47c10' }}>{pending.length}</span>
            )}
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</div>
          ) : pending.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>No pending requests right now.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {pending.map(s => (
                <div key={s._id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>
                    {s.student?.name?.substring(0, 2).toUpperCase() ?? 'ST'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{s.student?.name ?? 'Student'}</p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{s.subject} · {new Date(s.scheduledAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(s._id, 'accepted')} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90" style={{ backgroundColor: 'var(--color-emerald)', color: '#fff', fontFamily: 'var(--font-sans)' }}>Accept</button>
                    <button onClick={() => handleAction(s._id, 'declined')} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Decline</button>
                    <button onClick={() => handleCancelClick(s._id)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 border" style={{ borderColor: '#f0bcbc', backgroundColor: '#fef2f2', color: '#c0392b', fontFamily: 'var(--font-sans)' }}>Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>History</h2>
            </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {history.map(s => {
                  const canCancel = s.status === 'accepted' && new Date(s.scheduledAt) > new Date();
                  const canComplete = s.status === 'accepted' && new Date(s.scheduledAt) <= new Date();
                  return (
                    <div key={s._id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{s.student?.name ?? 'Student'} — {s.subject}</p>
                        <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{new Date(s.scheduledAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: s.status === 'accepted' ? '#edfaf3' : s.status === 'completed' ? '#f0f4ff' : '#fef2f2', color: s.status === 'accepted' ? '#1a7a45' : s.status === 'completed' ? '#3b5bdb' : '#c0392b' }}>
                          {s.status}
                        </span>
                        {canComplete && (
                          <button
                            onClick={() => handleCompleteClick(s._id)}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-90"
                            style={{ backgroundColor: '#f0f4ff', color: '#3b5bdb', border: '1px solid #bcc4f5' }}
                          >
                            Mark Complete
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
                  );
                })}
              </div>
          </div>
        )}
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
    </>
  );
}

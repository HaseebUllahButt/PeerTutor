'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';

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
};

export default function SessionsPageClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  return (
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
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>{s.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const navItems = [
  { label: 'Schedule',    href: '/dashboard',          icon: '' },
  { label: 'My Students', href: '/dashboard/students', icon: '' },
  { label: 'Requests',    href: '/dashboard/requests', icon: '' },
  { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
  { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
];

export default function EarningsClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); setLoading(false); });
  }, []);

  const completed = sessions.filter(s => s.status === 'accepted');
  const totalEarnings = completed.length * 500; // Rs. 500 per session placeholder

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Earnings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Your session earnings and payment history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Earned', value: `Rs. ${totalEarnings.toLocaleString()}` },
            { label: 'Sessions Completed', value: completed.length.toString() },
            { label: 'Rate per Session', value: 'Rs. 500' },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>{loading ? '—' : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Session Breakdown */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Session Breakdown</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</div>
          ) : completed.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>No completed sessions yet.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {completed.map(s => (
                <div key={s._id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{s.student?.name ?? 'Student'} — {s.subject}</p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{new Date(s.scheduledAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>+ Rs. 500</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-5 flex items-start gap-3" style={{ borderColor: '#d4f5e3', backgroundColor: '#edfaf3' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="9" cy="9" r="8" stroke="#1a7a45" strokeWidth="1.5"/>
            <path d="M9 5v4M9 12v.5" stroke="#1a7a45" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm" style={{ color: '#1a7a45', fontFamily: 'var(--font-sans)' }}>
            Payouts are processed monthly. Contact your platform administrator to set up your payment account.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const navItems = [
  { label: 'Overview',          href: '/dashboard',          icon: '' },
  { label: 'Manage Users',      href: '/dashboard/users',    icon: '' },
  { label: 'Reports',           href: '/dashboard/reports',  icon: '' },
  { label: 'Platform Settings', href: '/dashboard/settings', icon: '' },
];

export default function ReportsClient({ user }: { user: JWTPayload }) {
  const [stats, setStats] = useState({ totalUsers: 0, activeTutors: 0, totalSessions: 0, openReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d.stats) setStats(d.stats); setLoading(false); });
  }, []);

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Platform activity and usage statistics</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Registered Users', value: stats.totalUsers, icon: '👥' },
            { label: 'Active Tutors', value: stats.activeTutors, icon: '🎓' },
            { label: 'Total Sessions', value: stats.totalSessions, icon: '📅' },
            { label: 'Open Reports', value: stats.openReports, icon: '🚩' },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{s.label}</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Platform Health</h2>
          <div className="space-y-3">
            {[
              { label: 'User Registration', status: 'Operational', ok: true },
              { label: 'Session Booking', status: 'Operational', ok: true },
              { label: 'Authentication', status: 'Operational', ok: true },
              { label: 'Direct Messaging', status: 'Coming Soon', ok: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{item.label}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                  backgroundColor: item.ok ? '#edfaf3' : 'var(--color-paper)',
                  color: item.ok ? '#1a7a45' : 'var(--color-ink-50)',
                  fontFamily: 'var(--font-sans)',
                }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

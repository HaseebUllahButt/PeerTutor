'use client';

import { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { JWTPayload } from '@/lib/auth';

interface Props {
  user: JWTPayload;
}

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '📊' },
  { label: 'Manage Users', href: '/dashboard/users', icon: '👥' },
  { label: 'Reports', href: '/dashboard/reports', icon: '🚩' },
  { label: 'Platform Settings', href: '/dashboard/settings', icon: '⚙' },
];

interface RecentSignup {
  _id: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard({ user }: Props) {
  const [stats, setStats] = useState({ totalUsers: 0, activeTutors: 0, totalSessions: 0, openReports: 0 });
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.recentSignups) setRecentSignups(data.recentSignups);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-5xl mx-auto space-y-6" style={{ animation: 'fade-up 0.5s ease both' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Admin Console
            </h1>
            <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
              System overview and moderation, {user.name}.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers },
            { label: 'Active Tutors', value: stats.activeTutors },
            { label: 'Total Sessions', value: stats.totalSessions },
            { label: 'Open Reports', value: stats.openReports },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl border shadow-sm"
              style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                {loading ? '-' : stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border shadow-sm p-6" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Recent Signups
            </h2>
            {loading ? <p className="text-sm">Loading...</p> : (
              <div className="space-y-3">
                {recentSignups.map((signup) => (
                  <div key={signup._id} className="flex justify-between items-center text-sm p-3 rounded border" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{signup.name} ({signup.role}) joined platform</span>
                    <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{new Date(signup.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border shadow-sm p-6" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-danger)' }}>
              Actions Required
            </h2>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-sm p-3 rounded border" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
                  <span style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>All systems green. No flags or reports currently.</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

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

export default function UsersClient({ user }: { user: JWTPayload }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d.recentSignups) setUsers(d.recentSignups); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Manage Users</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>View and manage all platform users</p>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="px-4 py-2 rounded-lg border text-sm w-full sm:w-64"
            style={{ fontFamily: 'var(--font-sans)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          <div className="grid grid-cols-3 px-6 py-3 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            <span>Name</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>No users found.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {filtered.map((u: any) => (
                <div key={u._id} className="grid grid-cols-3 px-6 py-3.5 items-center hover:bg-[var(--color-paper)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}>
                      {u.name?.substring(0, 2).toUpperCase() ?? '??'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{u.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize w-fit" style={{
                    backgroundColor: u.role === 'tutor' ? '#edfaf3' : u.role === 'admin' ? '#fef2f2' : 'var(--color-gold-pale)',
                    color: u.role === 'tutor' ? '#1a7a45' : u.role === 'admin' ? '#c0392b' : 'var(--color-gold)',
                    fontFamily: 'var(--font-sans)',
                  }}>{u.role}</span>
                  <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

'use client';

import { useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const navByRole: Record<string, { label: string; href: string; icon: string }[]> = {
  student: [
    { label: 'Overview',      href: '/dashboard',          icon: '' },
    { label: 'Search Tutors', href: '/dashboard/search',   icon: '' },
    { label: 'My Sessions',   href: '/dashboard/sessions', icon: '' },
    { label: 'Messages',      href: '/dashboard/messages', icon: '' },
    { label: 'Settings',      href: '/dashboard/settings', icon: '' },
  ],
  tutor: [
    { label: 'Schedule',    href: '/dashboard',          icon: '' },
    { label: 'My Students', href: '/dashboard/students', icon: '' },
    { label: 'Requests',    href: '/dashboard/requests', icon: '' },
    { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
    { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
  ],
  admin: [
    { label: 'Overview',           href: '/dashboard',          icon: '' },
    { label: 'Manage Users',       href: '/dashboard/users',    icon: '' },
    { label: 'Reports',            href: '/dashboard/reports',  icon: '' },
    { label: 'Platform Settings',  href: '/dashboard/settings', icon: '' },
  ],
};

export default function SettingsClient({ user }: { user: JWTPayload }) {
  const navItems = navByRole[user.role] ?? navByRole.student;
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [notifSessions, setNotifSessions] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Manage your account preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Profile Section */}
          <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Profile</h2>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-ink-80)', fontFamily: 'var(--font-sans)' }}>Display Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{ fontFamily: 'var(--font-sans)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-gold)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-ink-80)', fontFamily: 'var(--font-sans)' }}>Email Address</label>
              <input
                value={email}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border text-sm opacity-50 cursor-not-allowed"
                style={{ fontFamily: 'var(--font-sans)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-ink-80)', fontFamily: 'var(--font-sans)' }}>Role</label>
              <span className="inline-block px-3 py-1.5 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-50)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Notifications</h2>
            {[
              { label: 'Session updates', desc: 'When sessions are booked, accepted, or declined', val: notifSessions, set: setNotifSessions },
              { label: 'New messages', desc: 'When you receive a direct message', val: notifMessages, set: setNotifMessages },
            ].map(({ label, desc, val, set }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set(!val)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ backgroundColor: val ? 'var(--color-gold)' : 'var(--color-border)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm"
                    style={{ transform: val ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
            >
              Save Changes
            </button>
            {saved && (
              <span className="text-sm font-medium" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>
                ✓ Saved!
              </span>
            )}
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

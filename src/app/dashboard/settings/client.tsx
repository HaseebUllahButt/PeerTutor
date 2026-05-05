'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const navByRole: Record<string, { label: string; href: string; icon: string }[]> = {
  student: [
    { label: 'Overview',      href: '/dashboard',          icon: '' },
    { label: 'Search Tutors', href: '/dashboard/search',   icon: '' },
    { label: 'My Sessions',   href: '/dashboard/sessions', icon: '' },
    { label: 'My Payments',   href: '/dashboard/payments', icon: '' },
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
  const router = useRouter();
  const navItems = navByRole[user.role] ?? navByRole.student;
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [notifSessions, setNotifSessions] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setSaveError(data.message || 'Failed to save changes');
      }
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/delete', { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(false);
    }
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
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-sm font-medium" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>
                ✓ Saved!
              </span>
            )}
            {saveError && (
              <span className="text-sm font-medium" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
                {saveError}
              </span>
            )}
          </div>
        </form>

        {/* Danger Zone */}
        <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: 'var(--color-canvas)', borderColor: '#fee2e2' }}>
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-danger)' }}>Danger Zone</h2>
          <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
          >
            Delete Account
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-xl shadow-xl w-full max-w-md overflow-hidden" style={{ backgroundColor: 'var(--color-canvas)', animation: 'fade-up 0.3s ease both' }}>
              <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Delete Account?</h3>
              </div>
              <div className="p-6 space-y-4">
                <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                  This will permanently delete your account and all associated data including sessions and messages. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const studentNav = [
  { label: 'Overview',      href: '/dashboard',          icon: '' },
  { label: 'Search Tutors', href: '/dashboard/search',   icon: '' },
  { label: 'My Sessions',   href: '/dashboard/sessions', icon: '' },
  { label: 'Messages',      href: '/dashboard/messages', icon: '' },
  { label: 'Settings',      href: '/dashboard/settings', icon: '' },
];

export default function MessagesClient({ user }: { user: JWTPayload }) {
  const isStudent = user.role === 'student';
  const navItems = isStudent ? studentNav : [
    { label: 'Schedule',    href: '/dashboard',          icon: '' },
    { label: 'My Students', href: '/dashboard/students', icon: '' },
    { label: 'Requests',    href: '/dashboard/requests', icon: '' },
    { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
    { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
  ];

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto h-full flex flex-col" style={{ gap: '0' }}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Messages</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Direct messages with your tutors and students</p>
        </div>

        <div className="rounded-xl border overflow-hidden flex-1 flex flex-col items-center justify-center py-20" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--color-paper)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M24 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H9L14 27L19 22H24C25.1 22 26 21.1 26 20V6C26 4.9 25.1 4 24 4Z" stroke="var(--color-ink-50)" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M8 11H20M8 15H16" stroke="var(--color-ink-50)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-base font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>No messages yet</p>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            Direct messaging will appear here once you have confirmed sessions with a tutor.
          </p>
          <span className="inline-block mt-4 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)', border: '1px solid var(--color-border)' }}>
            Coming Soon
          </span>
        </div>
      </div>
    </DashboardShell>
  );
}

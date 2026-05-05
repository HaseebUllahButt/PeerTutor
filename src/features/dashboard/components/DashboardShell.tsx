'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { clearTabAuthToken } from '@/lib/tabAuth';
import NotificationBell from './NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface DashboardShellProps {
  user: { name: string; role: string; email: string };
  navItems: NavItem[];
  children: React.ReactNode;
}

// Crisp SVG icons keyed by label
const Icons: Record<string, React.ReactElement> = {
  Overview: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Schedule: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 1.5V3.5M11 1.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  'Search Tutors': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  'My Sessions': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 1.5V3.5M11 1.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 10l1.5 1.5L11 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'My Payments': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 7.5H14.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="4" cy="10.5" r="1" fill="currentColor"/>
    </svg>
  ),
  Messages: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 2.5H2.5C1.95 2.5 1.5 2.95 1.5 3.5V10.5C1.5 11.05 1.95 11.5 2.5 11.5H5.5L8 14.5L10.5 11.5H13.5C14.05 11.5 14.5 11.05 14.5 10.5V3.5C14.5 2.95 14.05 2.5 13.5 2.5Z" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.4 4.4M11.6 11.6L12.6 12.6M3.4 12.6L4.4 11.6M11.6 4.4L12.6 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  'My Students': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 13.5C2 11.5 4.7 10 8 10C11.3 10 14 11.5 14 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Requests: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3.5C2 2.95 2.45 2.5 3 2.5H13C13.55 2.5 14 2.95 14 3.5V11.5C14 12.05 13.55 12.5 13 12.5H5L2 14.5V3.5Z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5.5 7H10.5M8 5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Earnings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5V5.5M8 10.5V11M6.5 9.5C6.5 10.33 7.17 11 8 11C8.83 11 9.5 10.33 9.5 9.5C9.5 8.67 8.83 8 8 8C7.17 8 6.5 7.33 6.5 6.5C6.5 5.67 7.17 5 8 5C8.83 5 9.5 5.67 9.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Profile: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 13.5C2 11.5 4.7 10 8 10C11.3 10 14 11.5 14 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  'Manage Users': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1 13C1 11.3 3.2 10 6 10C8.8 10 11 11.3 11 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11 2.5C12.5 2.5 13.5 3.5 13.5 5C13.5 6.5 12.5 7.5 11 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M13 10.5C14 11 15 11.9 15 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Reports: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10 2v3h3M5 7h6M5 9.5h6M5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  'Platform Settings': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.4 4.4M11.6 11.6L12.6 12.6M3.4 12.6L4.4 11.6M11.6 4.4L12.6 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
};

export default function DashboardShell({ user, navItems, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    clearTabAuthToken();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadgeColor = {
    student: { bg: 'rgba(181,136,58,0.15)', text: 'var(--color-gold)', label: 'Student' },
    tutor:   { bg: 'rgba(52,168,83,0.15)',  text: '#34a853',           label: 'Tutor'   },
    admin:   { bg: 'rgba(234,67,53,0.15)',  text: '#ea4335',           label: 'Admin'   },
  }[user.role] ?? { bg: 'rgba(255,255,255,0.08)', text: '#a0a0b0', label: user.role };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-60 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backgroundColor: '#0e0f11',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Brand */}
        <div className="px-5 h-14 flex items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: '#f5f0e8' }}>
            Peer<span style={{ color: 'var(--color-gold)' }}>Tutor</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = Icons[item.label];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
                style={{
                  color: active ? '#f5f0e8' : 'rgba(255,255,255,0.4)',
                  backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ backgroundColor: 'var(--color-gold)' }}
                  />
                )}
                <span
                  className="w-4 h-4 flex-shrink-0 transition-colors duration-150"
                  style={{ color: active ? 'var(--color-gold)' : 'rgba(255,255,255,0.35)' }}
                >
                  {Icon ?? <span className="text-base leading-none">{item.icon}</span>}
                </span>
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    className="ml-auto min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-gold)',
                      color: 'var(--color-canvas)',
                    }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--color-gold)', color: '#0e0f11', fontFamily: 'var(--font-sans)' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: '#f5f0e8', fontFamily: 'var(--font-sans)' }}>
                {user.name}
              </p>
              <span
                className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium capitalize mt-0.5"
                style={{ backgroundColor: roleBadgeColor.bg, color: roleBadgeColor.text, fontFamily: 'var(--font-sans)' }}
              >
                {roleBadgeColor.label}
              </span>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M5 2H2.5A1 1 0 001.5 3v7a1 1 0 001 1H5M9 9.5l3-3-3-3M11.5 6.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 flex-shrink-0"
          style={{
            backgroundColor: 'var(--color-canvas)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <button
            className="lg:hidden p-1.5 rounded-md transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            style={{ color: 'var(--color-ink-50)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="text-sm hidden lg:block" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
            Welcome back, <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{user.name.split(' ')[0]}</span>
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'var(--color-gold)', color: '#0e0f11', fontFamily: 'var(--font-sans)' }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

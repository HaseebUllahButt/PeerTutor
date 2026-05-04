'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from './DashboardShell';
import { JWTPayload } from '@/lib/auth';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { ensureTabAuthTokenFromCookie, getTabAuthToken } from '@/lib/tabAuth';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

interface Props {
  user: JWTPayload;
}

export default function StudentDashboard({ user }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: '⌂' },
    { label: 'Search Tutors', href: '/dashboard/search', icon: '🔍' },
    { label: 'My Sessions', href: '/dashboard/sessions', icon: '📅' },
    { label: 'My Payments', href: '/dashboard/payments', icon: '💸' },
    { label: 'Messages', href: '/dashboard/messages', icon: '💬', badge: unreadCount },
    { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
  ];

  useEffect(() => {
    authenticatedFetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
        setLoading(false);
      });
  }, []);

  const fetchUnreadCount = useCallback(() => {
    authenticatedFetch('/api/conversations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.conversations)) {
          const count = data.conversations.reduce((acc: number, conv: { unreadCount?: number }) => {
            return acc + (typeof conv.unreadCount === 'number' ? conv.unreadCount : 0);
          }, 0);
          setUnreadCount(count);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    let disposed = false;
    let socket: ReturnType<typeof io> | null = null;

    ensureTabAuthTokenFromCookie().then(() => {
      if (disposed) return;
      const token = getTabAuthToken();
      if (!token) return;
      socket = io(window.location.origin, {
        path: '/api/socket',
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });
      if (disposed) {
        socket.close();
        socket = null;
        return;
      }
      socket.on('new_message', fetchUnreadCount);
      socket.on('peer_read_receipt', fetchUnreadCount);
    });

    return () => {
      disposed = true;
      socket?.close();
    };
  }, [fetchUnreadCount]);

  const upcomingSessions = sessions.filter(s => s.status === 'accepted');
  const pendingSessions = sessions.filter(s => s.status === 'pending');

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-5xl mx-auto space-y-6" style={{ animation: 'fade-up 0.5s ease both' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
              Welcome back to your educational journey, {user.name}.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/search')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap w-max"
            style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
          >
            Find a Tutor
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           {[
             { label: 'Upcoming Sessions', value: upcomingSessions.length.toString() },
             { label: 'Pending Requests', value: pendingSessions.length.toString() },
             { label: 'Total Sessions', value: sessions.length.toString() },
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
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Upcoming Box */}
        <div className="rounded-xl border shadow-sm p-6" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            Your Sessions
          </h2>
          {loading ? <p className="text-sm">Loading sessions...</p> : sessions.length === 0 ? (
            <p className="text-sm text-gray-500">You have no active sessions. Book one to get started!</p>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session._id} className="flex items-center gap-4 p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}>
                    <span className="font-bold text-lg">{session.tutor?.name.substring(0, 2).toUpperCase() || 'TU'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{session.subject}</p>
                    <p className="text-sm truncate" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>with {session.tutor?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: session.status === 'accepted' ? 'var(--color-emerald)' : 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      {new Date(session.scheduledAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: session.status === 'pending' ? 'orange' : session.status === 'declined' ? 'red' : 'green', fontFamily: 'var(--font-sans)' }}>{session.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

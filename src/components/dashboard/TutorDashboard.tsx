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

export default function TutorDashboard({ user }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { label: 'Schedule', href: '/dashboard', icon: '📅' },
    { label: 'My Students', href: '/dashboard/students', icon: '🎓' },
    { label: 'Requests', href: '/dashboard/requests', icon: '📥' },
    { label: 'Messages', href: '/dashboard/messages', icon: '💬', badge: unreadCount },
    { label: 'Earnings', href: '/dashboard/earnings', icon: '💰' },
    { label: 'Profile', href: '/dashboard/profile', icon: '👤' },
  ];

  const fetchSessions = () => {
    authenticatedFetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
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

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await authenticatedFetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchSessions();
    } catch(err) {
      console.error(err);
    }
  };

  const pendingRequests = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'accepted');
  const hoursCalculation = upcomingSessions.length * 1; // Placeholder - calculate from session duration
  const rating = user.tutorProfile?.averageRating ?? 0;

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-5xl mx-auto space-y-6" style={{ animation: 'fade-up 0.5s ease both' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Tutor Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
              Manage your sessions and students, {user.name}.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap w-max"
            style={{ backgroundColor: 'var(--color-emerald)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
          >
            Update Availability Profile
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending Requests', value: pendingRequests.length.toString() },
            { label: 'Upcoming Sessions', value: upcomingSessions.length.toString() },
            { label: 'Hours Taught', value: hoursCalculation.toString() },
            { label: 'Rating', value: rating > 0 ? `${rating}★` : 'No ratings yet' },
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

        {/* Action Box */}
        <div className="rounded-xl border shadow-sm p-6" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            Recent Requests
          </h2>
          {loading ? <p className="text-sm">Loading requests...</p> : pendingRequests.length === 0 ? (
            <p className="text-sm text-gray-500">You have no pending requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(session => (
                <div key={session._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-ink-50)', color: 'var(--color-canvas)' }}>
                    <span className="font-bold text-sm">{session.student?.name.substring(0,2).toUpperCase() || 'ST'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{session.student?.name}</p>
                    <p className="text-sm truncate" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Requested: {session.subject} on {new Date(session.scheduledAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateStatus(session._id, 'accepted')} className="text-xs px-4 py-2 hover:-translate-y-0.5 transition-transform rounded-md font-semibold" style={{ backgroundColor: 'var(--color-emerald)', color: 'var(--color-canvas)' }}>Accept</button>
                    <button onClick={() => handleUpdateStatus(session._id, 'declined')} className="text-xs px-4 py-2 hover:-translate-y-0.5 transition-transform rounded-md font-semibold border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-80)' }}>Decline</button>
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

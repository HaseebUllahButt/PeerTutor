'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { formatDistanceToNow } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import { getTabAuthToken } from '@/lib/tabAuth';

interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  booking_request:   '📥',
  booking_accepted:  '✅',
  booking_declined:  '❌',
  booking_cancelled: '🚫',
  session_complete:  '🎓',
  new_message:       '💬',
  payment_received:  '💰',
  session_reminder:  '⏰',
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  // Poll every 30s
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Live socket listener — instant bell update on new notification
  useEffect(() => {
    const token = getTabAuthToken();
    if (!token) return;

    const socket: Socket = io(window.location.origin, {
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('notification', (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.close();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      // Mark all as read
      await authenticatedFetch('/api/notifications/read', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }

  async function handleClear() {
    await authenticatedFetch('/api/notifications', { method: 'DELETE' });
    setNotifications([]);
    setUnreadCount(0);
  }

  function handleClickNotification(notif: AppNotification) {
    setOpen(false);
    if (notif.link) router.push(notif.link);
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          backgroundColor: open ? 'var(--color-paper-dark)' : 'var(--color-canvas)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
      >
        {/* Bell SVG */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--color-ink)' }}>
          <path
            d="M8 1.5C5.52 1.5 3.5 3.52 3.5 6v3.5L2 11h12l-1.5-1.5V6C12.5 3.52 10.48 1.5 8 1.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M6.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-danger)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              fontFamily: 'var(--font-sans)',
              border: '2px solid var(--color-canvas)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            maxHeight: '420px',
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-canvas)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fade-up 0.2s ease both',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px 10px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--color-ink-50)',
                  fontFamily: 'var(--font-sans)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🔔</span>
                <p style={{ color: 'var(--color-ink-50)', fontSize: '13px', fontFamily: 'var(--font-sans)', margin: 0 }}>
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleClickNotification(notif)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: notif.read ? 'transparent' : 'rgba(181,136,58,0.06)',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: notif.link ? 'pointer' : 'default',
                    textAlign: 'left',
                    border: 'none',
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: 'var(--color-border)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (notif.link) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-paper)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = notif.read ? 'transparent' : 'rgba(181,136,58,0.06)';
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-gold-pale)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {typeIcon[notif.type] ?? '🔔'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: '13px',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-sans)',
                      marginBottom: '2px',
                    }}>
                      {notif.title}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--color-ink-50)',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.4,
                    }}>
                      {notif.body}
                    </p>
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '11px',
                      color: 'var(--color-gold)',
                      fontFamily: 'var(--font-sans)',
                    }}>
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-gold)',
                      flexShrink: 0,
                      marginTop: '4px',
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import ConversationList from '@/features/messaging/components/ConversationList';
import ChatWindow from '@/features/messaging/components/ChatWindow';
import NewConversationModal from '@/features/messaging/components/NewConversationModal';
import { JWTPayload } from '@/lib/auth';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { ensureTabAuthTokenFromCookie, getTabAuthToken } from '@/lib/tabAuth';
import { io, Socket } from 'socket.io-client';

interface ToastNotification {
  id: string;
  senderName: string;
  message: string;
  conversationId: string;
  avatar?: string;
}

interface Participant {
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
  role: string;
  joinedAt: string;
  lastReadMessageId?: string;
}

interface LastMessage {
  messageId: string;
  senderId: string | { _id: string };
  content: string;
  sentAt: string;
  type: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  sessionId?: {
    _id: string;
    subject: string;
    scheduledAt: string;
    status: string;
  };
  type: string;
  status: string;
  lastMessage?: LastMessage;
  /** Denormalized for unread badges (matches API) */
  unreadCount?: number;
  lastMessageSenderId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  content: {
    type: string;
    body: string;
  };
  readStatus: {
    isRead: boolean;
    readBy: Array<{
      userId: string;
      readAt: string;
    }>;
  };
  deliveredAt?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

function normalizeMessage(m: Message): Message {
  const raw = m.senderId as unknown;
  const sid =
    typeof raw === 'object' && raw !== null && '_id' in raw
      ? String((raw as { _id: string })._id)
      : String(raw);
  const base =
    typeof raw === 'object' && raw !== null
      ? (raw as Message['senderId'])
      : ({ _id: sid, name: 'Unknown', email: '' } satisfies Message['senderId']);
  return {
    ...m,
    senderId: { ...base, _id: sid },
    deliveredAt: m.deliveredAt ?? null,
  };
}

function mergeIncomingMessages(prev: Message[], incoming: Message): Message[] {
  const realId = incoming._id;
  if (prev.some((msg) => msg._id === realId)) return prev;

  const tempIdx = prev.findIndex((msg) => {
    if (!String(msg._id).startsWith('temp-')) return false;
    if (msg.senderId._id !== incoming.senderId._id) return false;
    if (msg.content.body !== incoming.content.body) return false;
    return true;
  });

  if (tempIdx >= 0) {
    const next = [...prev];
    next[tempIdx] = incoming;
    return next;
  }

  return [...prev, incoming];
}

const studentNav = [
  { label: 'Overview',      href: '/dashboard',          icon: '' },
  { label: 'Search Tutors', href: '/dashboard/search',   icon: '' },
  { label: 'My Sessions',   href: '/dashboard/sessions', icon: '' },
  { label: 'Messages',      href: '/dashboard/messages', icon: '' },
  { label: 'Settings',      href: '/dashboard/settings', icon: '' },
];

const tutorNav = [
  { label: 'Schedule',    href: '/dashboard',          icon: '' },
  { label: 'My Students', href: '/dashboard/students', icon: '' },
  { label: 'Requests',    href: '/dashboard/requests', icon: '' },
  { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
  { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
];

export default function MessagesClient() {
  const router = useRouter();
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let token = getTabAuthToken();
        if (!token) {
          const ok = await ensureTabAuthTokenFromCookie();
          if (!ok) {
            if (!cancelled) router.replace('/login');
            return;
          }
          token = getTabAuthToken();
        }
        if (!token) {
          if (!cancelled) router.replace('/login');
          return;
        }
        const me = await authenticatedFetch('/api/auth/me');
        if (!me.ok) {
          if (!cancelled) router.replace('/login');
          return;
        }
        const data = await me.json();
        if (cancelled) return;
        setUser({
          userId: data.userId,
          role: data.role,
          name: data.name,
          email: data.email,
          tutorProfile: data.tutorProfile,
        });
      } catch {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const isStudent = user?.role === 'student';
  const navItems = isStudent ? studentNav : tutorNav;

  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id); }
  }, []);

  const showToast = useCallback((toast: ToastNotification) => {
    setToasts((prev) => {
      if (prev.some((t) => t.id === toast.id)) return prev;
      return [toast, ...prev].slice(0, 3);
    });
    const timer = setTimeout(() => dismissToast(toast.id), 5000);
    toastTimers.current.set(toast.id, timer);
  }, [dismissToast]);

  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  /** Synchronous guard for which thread is open (avoids stale closure + race with fetch). */
  const activeConversationIdRef = useRef<string | null>(null);
  const fetchConversationsRef = useRef<() => Promise<Conversation[] | null>>(async () => null);
  const fetchMessagesRef = useRef<(id: string) => Promise<void>>(async () => {});
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async (): Promise<Conversation[] | null> => {
    try {
      const res = await authenticatedFetch('/api/conversations');
      const data = await res.json();
      if (!res.ok) {
        console.error('Error fetching conversations:', data?.message || res.statusText);
        return null;
      }
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        return data.conversations as Conversation[];
      }
      return null;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  fetchConversationsRef.current = fetchConversations;

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const requestedFor = conversationId;
    try {
      const res = await authenticatedFetch(`/api/messages/${conversationId}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('Error fetching messages:', data?.message || res.statusText);
        return;
      }
      if (activeConversationIdRef.current !== requestedFor) return;
      if (Array.isArray(data.messages)) {
        setMessages(data.messages.map(normalizeMessage));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  fetchMessagesRef.current = fetchMessages;

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !user) return;

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConversation._id,
      senderId: {
        _id: user.userId,
        name: user.name,
        email: user.email,
      },
      content: { type: 'text', body: content },
      readStatus: { isRead: false, readBy: [] },
      deliveredAt: null,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await authenticatedFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          content,
          type: 'text',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
        console.error('Error sending message:', data?.message || res.statusText);
        return;
      }

      if (data.data) {
        const normalized = normalizeMessage(data.data as Message);
        setMessages((prev) => prev.map((msg) => (msg._id === optimisticMessage._id ? normalized : msg)));
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
      }

      void fetchConversationsRef.current();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
    }
  };

  // Delete message — soft delete, update UI immediately
  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, isDeleted: true } : msg
      )
    );
    void fetchConversationsRef.current();
  };

  // Create new conversation
  const handleCreateConversation = async (participantId: string, initialMessage: string) => {
    try {
      const convRes = await authenticatedFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          initialMessage,
        }),
      });

      const convData = await convRes.json();

      if (!convRes.ok) {
        console.error('Error creating conversation:', convData.message);
        return;
      }

      const createdOrExisting = convData.conversation as Conversation;

      const msgRes = await authenticatedFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: createdOrExisting._id,
          content: initialMessage,
          type: 'text',
        }),
      });

      const msgData = await msgRes.json().catch(() => ({}));
      if (!msgRes.ok) {
        console.error('Error sending initial message:', msgData?.message || msgRes.statusText);
        await fetchConversations();
        return;
      }

      const refreshed = await fetchConversations();
      const resolved =
        refreshed?.find((c) => c._id === createdOrExisting._id) ?? createdOrExisting;

      await handleSelectConversation(resolved);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = useCallback(async (conversation: Conversation) => {
    activeConversationIdRef.current = conversation._id;
    setActiveConversation(conversation);
    await fetchMessages(conversation._id);

    await authenticatedFetch('/api/messages/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversation._id,
      }),
    });
    await fetchConversations();
  }, [fetchMessages, fetchConversations]);

  useEffect(() => {
    if (!sessionReady || !user) return;
    const token = getTabAuthToken();
    if (!token) return;

    const newSocket = io(window.location.origin, {
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('new_message', (data: { conversationId: string; message: Message }) => {
      const incoming = normalizeMessage(data.message);
      const isFromMe = incoming.senderId._id === user.userId;

      if (!isFromMe) {
        newSocket.emit('message_delivered', {
          conversationId: data.conversationId,
          messageId: incoming._id,
        });
      }

      void fetchConversationsRef.current();

      const isActiveConversation = data.conversationId === activeConversationIdRef.current;

      if (isActiveConversation) {
        // Message is in the open chat — append it directly
        setMessages((prev) => mergeIncomingMessages(prev, incoming));
      } else if (!isFromMe) {
        // Message is in a background conversation — show notification
        const senderName = incoming.senderId.name || 'Someone';
        const preview = incoming.content.body.length > 60
          ? incoming.content.body.slice(0, 60) + '…'
          : incoming.content.body;

        // In-app toast
        showToastRef.current({
          id: incoming._id,
          senderName,
          message: preview,
          conversationId: data.conversationId,
          avatar: incoming.senderId.profilePicture,
        });

        // Browser notification (when tab is not focused)
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted' &&
          document.visibilityState === 'hidden'
        ) {
          new Notification(`New message from ${senderName}`, {
            body: preview,
            icon: '/favicon.ico',
          });
        }
      }
    });

    newSocket.on(
      'message_status',
      (payload: { conversationId: string; messageId: string; status: string }) => {
        if (payload.conversationId !== activeConversationIdRef.current) return;
        if (payload.status !== 'delivered') return;
        setMessages((prev) =>
          prev.map((m) =>
            m._id === payload.messageId
              ? { ...m, deliveredAt: m.deliveredAt ?? new Date().toISOString() }
              : m
          )
        );
      }
    );

    newSocket.on('peer_read_receipt', (payload: { conversationId: string }) => {
      void fetchConversationsRef.current();
      if (payload.conversationId && payload.conversationId === activeConversationIdRef.current) {
        void fetchMessagesRef.current(payload.conversationId);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [sessionReady, user]);

  // Join conversation room when active conversation changes
  useEffect(() => {
    if (socket && activeConversation) {
      socket.emit('join_conversation', activeConversation._id);
      return () => {
        socket.emit('leave_conversation', activeConversation._id);
      };
    }
  }, [socket, activeConversation]);

  useEffect(() => {
    if (!sessionReady || !user) return;
    fetchConversations();
  }, [sessionReady, user, fetchConversations]);

  useEffect(() => {
    setActiveConversation((prev) => {
      if (!prev) return prev;
      const fresh = conversations.find((c) => c._id === prev._id);
      if (!fresh) return prev;
      const lmPrev = prev.lastMessage?.messageId ?? prev.lastMessage?.content;
      const lmFresh = fresh.lastMessage?.messageId ?? fresh.lastMessage?.content;
      if (
        fresh.updatedAt === prev.updatedAt &&
        fresh.unreadCount === prev.unreadCount &&
        fresh.lastMessageSenderId === prev.lastMessageSenderId &&
        lmPrev === lmFresh
      ) {
        return prev;
      }
      return fresh;
    });
  }, [conversations]);

  if (!sessionReady || !user) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
          Loading messages…
        </p>
      </div>
    );
  }

  return (
    <DashboardShell user={user} navItems={navItems}>
      {/* Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '14px',
              backgroundColor: 'var(--color-ink)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              minWidth: '280px',
              maxWidth: '340px',
              animation: 'fade-up 0.3s ease both',
              cursor: 'pointer',
              border: '1px solid rgba(181,136,58,0.25)',
            }}
            onClick={() => {
              const conv = conversations.find((c) => c._id === toast.conversationId);
              if (conv) handleSelectConversation(conv);
              dismissToast(toast.id);
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-sans)',
                overflow: 'hidden',
              }}
            >
              {toast.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={toast.avatar} alt={toast.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                toast.senderName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-gold)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.02em',
                marginBottom: '2px',
              }}>
                {toast.senderName}
              </p>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(246,241,234,0.85)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {toast.message}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(246,241,234,0.4)',
                fontSize: '16px',
                lineHeight: 1,
                padding: '0',
                flexShrink: 0,
                marginTop: '1px',
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex h-[calc(100vh-140px)] gap-0 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        {/* Conversation List - Sidebar */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r" style={{ borderColor: 'var(--color-border)' }}>
          <ConversationList
            conversations={conversations}
            currentUserId={user.userId}
            activeConversationId={activeConversation?._id}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={() => setIsModalOpen(true)}
          />

          {/* New Conversation Modal */}
          <NewConversationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleCreateConversation}
            currentUserRole={user.role}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 min-w-0 hidden lg:block">
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              currentUserId={user.userId}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onBack={() => {
                activeConversationIdRef.current = null;
                setActiveConversation(null);
              }}
              isLoading={loading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full" style={{ backgroundColor: 'var(--color-paper)' }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-gold-pale)' }}
              >
                <span className="text-3xl">💬</span>
              </div>
              <p
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
              >
                Select a conversation
              </p>
              <p
                className="text-sm text-center max-w-xs"
                style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
              >
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          )}
        </div>

        {/* Mobile: Full screen chat when active */}
        <div className="fixed inset-0 z-50 lg:hidden" style={{ display: activeConversation ? 'block' : 'none' }}>
          {activeConversation && (
            <div className="h-full" style={{ backgroundColor: 'var(--color-paper)' }}>
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                currentUserId={user.userId}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                onBack={() => {
                  activeConversationIdRef.current = null;
                  setActiveConversation(null);
                }}
                isLoading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

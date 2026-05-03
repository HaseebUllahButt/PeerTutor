'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import NewConversationModal from '@/components/messages/NewConversationModal';
import { JWTPayload } from '@/lib/auth';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { ensureTabAuthTokenFromCookie, getTabAuthToken } from '@/lib/tabAuth';
import { io, Socket } from 'socket.io-client';

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

      if (incoming.senderId._id !== user.userId) {
        newSocket.emit('message_delivered', {
          conversationId: data.conversationId,
          messageId: incoming._id,
        });
      }

      void fetchConversationsRef.current();

      if (data.conversationId !== activeConversationIdRef.current) return;

      setMessages((prev) => mergeIncomingMessages(prev, incoming));
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
            currentUserId={user.userId}
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

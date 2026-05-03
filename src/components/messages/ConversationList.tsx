'use client';

import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConversationListItem from './ConversationListItem';

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
  unreadCount?: number;
  lastMessageSenderId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation?: () => void;
}

export default function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId._id !== currentUserId
      );
      const name = otherParticipant?.userId.name || '';
      const subject = conv.sessionId?.subject || '';
      const lastMessage = conv.lastMessage?.content || '';

      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations, currentUserId]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Messages
          </h2>
          {onCreateConversation && (
            <button
              onClick={onCreateConversation}
              className="p-2 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-gold)' }}
              aria-label="New conversation"
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--color-canvas)' }} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--color-ink-50)' }}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all"
            style={{
              backgroundColor: 'var(--color-canvas)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-canvas)' }}
            >
              <span className="text-3xl">💬</span>
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
            >
              No conversations yet
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
            >
              Start chatting with your tutors or students
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <ConversationListItem
                key={conversation._id}
                conversation={conversation}
                currentUserId={currentUserId}
                isActive={activeConversationId === conversation._id}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

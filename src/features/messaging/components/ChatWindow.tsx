'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import Image from 'next/image';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

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

interface Session {
  _id: string;
  subject: string;
  scheduledAt: string;
  status: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  sessionId?: Session;
  type: string;
  status: string;
  createdAt: string;
}

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onBack?: () => void;
  onSendMessage: (content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isLoading?: boolean;
}

export default function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onBack,
  onSendMessage,
  onDeleteMessage,
  isLoading = false,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherParticipant = conversation.participants.find(
    (p) => p.userId._id !== currentUserId
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg transition-all"
              style={{ backgroundColor: 'var(--color-canvas)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-ink)' }} />
            </button>
          )}

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: otherParticipant?.userId.profilePicture
                ? 'transparent'
                : 'var(--color-gold)',
              color: 'var(--color-canvas)',
            }}
          >
            {otherParticipant?.userId.profilePicture ? (
              <Image
                src={otherParticipant.userId.profilePicture}
                alt={otherParticipant.userId.name}
                width={40}
                height={40}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(otherParticipant?.userId.name || 'U')
            )}
          </div>

          {/* Info */}
          <div>
            <h3
              className="font-semibold text-sm"
              style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
            >
              {otherParticipant?.userId.name || 'Unknown'}
            </h3>
            <p
              className="text-xs"
              style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}
            >
              {conversation.sessionId
                ? `${conversation.sessionId.subject} • ${conversation.sessionId.status}`
                : 'Direct Message'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--color-canvas)' }}
          >
            <Phone className="w-4 h-4" style={{ color: 'var(--color-ink)' }} />
          </button>
          <button
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--color-canvas)' }}
          >
            <Video className="w-4 h-4" style={{ color: 'var(--color-ink)' }} />
          </button>
          <button
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--color-canvas)' }}
          >
            <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-ink)' }} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-gold-pale)' }}
            >
              <span className="text-4xl">👋</span>
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
            >
              Say hello to {otherParticipant?.userId.name || 'your contact'}
            </p>
            <p
              className="text-xs max-w-xs"
              style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
            >
              Start the conversation by sending a message below
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMine = message.senderId._id === currentUserId;
            const showAvatar =
              !isMine &&
              (index === 0 || messages[index - 1].senderId._id !== message.senderId._id);

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isMine={isMine}
                showAvatar={showAvatar}
                onDelete={onDeleteMessage}
              />
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div
        className="p-4 border-t"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}
      >
        <MessageInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

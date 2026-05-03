'use client';

import { formatDistanceToNow } from 'date-fns';

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

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
  onClick: () => void;
}

export default function ConversationListItem({
  conversation,
  currentUserId,
  isActive = false,
  onClick,
}: ConversationListItemProps) {
  const otherParticipant = conversation.participants.find(
    (p) => p.userId._id !== currentUserId
  );

  const lastSenderRaw =
    conversation.lastMessageSenderId ??
    (conversation.lastMessage?.senderId == null
      ? undefined
      : typeof conversation.lastMessage.senderId === 'string'
        ? conversation.lastMessage.senderId
        : conversation.lastMessage.senderId._id);

  const isLastMessageFromMe = lastSenderRaw === currentUserId;

  const unreadCount =
    typeof conversation.unreadCount === 'number'
      ? conversation.unreadCount
      : (() => {
          const myParticipantData = conversation.participants.find((p) => p.userId._id === currentUserId);
          if (!conversation.lastMessage || isLastMessageFromMe) return 0;
          if (!myParticipantData?.lastReadMessageId) return 1;
          if (conversation.lastMessage.messageId !== myParticipantData.lastReadMessageId) return 1;
          return 0;
        })();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl transition-all duration-200 text-left"
      style={{
        backgroundColor: isActive ? 'var(--color-gold-pale)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: otherParticipant?.userId.profilePicture
                ? 'transparent'
                : 'var(--color-gold)',
              color: 'var(--color-canvas)',
            }}
          >
            {otherParticipant?.userId.profilePicture ? (
              <img
                src={otherParticipant.userId.profilePicture}
                alt={otherParticipant.userId.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(otherParticipant?.userId.name || 'U')
            )}
          </div>
          {/* Online indicator - placeholder */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: 'var(--color-emerald)',
              borderColor: 'var(--color-paper)',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className="font-semibold text-sm truncate"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-ink)',
              }}
            >
              {otherParticipant?.userId.name || 'Unknown'}
            </h3>
            {conversation.lastMessage && (
              <span
                className="text-xs flex-shrink-0"
                style={{ color: 'var(--color-ink-50)' }}
              >
                {formatDistanceToNow(new Date(conversation.lastMessage.sentAt), {
                  addSuffix: false,
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            {conversation.sessionId && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--color-gold-pale)',
                  color: 'var(--color-gold)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {conversation.sessionId.subject}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            <p
              className="text-sm truncate"
              style={{
                fontFamily: 'var(--font-sans)',
                color: isLastMessageFromMe ? 'var(--color-ink-50)' : 'var(--color-ink)',
                fontWeight: unreadCount > 0 ? 600 : 400,
              }}
            >
              {isLastMessageFromMe && (
                <span style={{ color: 'var(--color-ink-50)' }}>You: </span>
              )}
              {conversation.lastMessage?.content || 'Start a conversation'}
            </p>

            {unreadCount > 0 && (
              <span
                className="flex-shrink-0 ml-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-canvas)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

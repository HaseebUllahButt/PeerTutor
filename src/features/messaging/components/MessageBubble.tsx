'use client';

import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface MessageSender {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: MessageSender;
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

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar = true,
}: MessageBubbleProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const readByOthers = message.readStatus.readBy.filter((r) => r.userId !== message.senderId._id);
  const isRead = readByOthers.length > 0;
  const isDelivered = Boolean(message.deliveredAt);

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - only show for others and on first message in sequence */}
        {!isMine && showAvatar && (
          <div className="flex-shrink-0 mt-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: message.senderId.profilePicture
                  ? 'transparent'
                  : 'var(--color-gold)',
                color: 'var(--color-canvas)',
              }}
            >
              {message.senderId.profilePicture ? (
                <Image
                  src={message.senderId.profilePicture}
                  alt={message.senderId.name}
                  width={32}
                  height={32}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(message.senderId.name)
              )}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {/* Sender Name - only show for others */}
          {!isMine && showAvatar && (
            <span
              className="text-xs mb-1 ml-1"
              style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
            >
              {message.senderId.name}
            </span>
          )}

          {/* Bubble */}
          <div
            className="px-4 py-2.5 rounded-2xl shadow-sm"
            style={{
              backgroundColor: isMine ? 'var(--color-gold)' : 'var(--color-canvas)',
              borderTopLeftRadius: !isMine ? '4px' : undefined,
              borderTopRightRadius: isMine ? '4px' : undefined,
              border: isMine ? 'none' : '1px solid var(--color-border)',
            }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{
                color: isMine ? 'var(--color-canvas)' : 'var(--color-ink)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {message.content.body}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-xs"
              style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
            >
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>

            {message.isEdited && (
              <span
                className="text-xs"
                style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
              >
                • edited
              </span>
            )}

            {/* Sent / delivered / read — own messages only */}
            {isMine && (
              <span className="flex items-center ml-1" aria-label={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}>
                {isRead ? (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                ) : isDelivered ? (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-50)' }} />
                ) : (
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-50)' }} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

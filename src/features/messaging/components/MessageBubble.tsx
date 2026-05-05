'use client';

import { useState } from 'react';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

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
  onDelete?: (messageId: string) => void;
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar = true,
  onDelete,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;
    setDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/messages/${message._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDelete?.(message._id);
      }
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeleting(false);
    }
  };

  const readByOthers = message.readStatus.readBy.filter((r) => r.userId !== message.senderId._id);
  const isRead = readByOthers.length > 0;
  const isDelivered = Boolean(message.deliveredAt);

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex gap-2 max-w-[75%] items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
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

        {/* Delete button — shown on hover, only for own messages */}
        {isMine && hovered && !message.isDeleted && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete message"
            style={{
              background: 'none',
              border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '6px',
              opacity: deleting ? 0.4 : 0.6,
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
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
              backgroundColor: message.isDeleted
                ? 'var(--color-paper-dark)'
                : isMine
                ? 'var(--color-gold)'
                : 'var(--color-canvas)',
              borderTopLeftRadius: !isMine ? '4px' : undefined,
              borderTopRightRadius: isMine ? '4px' : undefined,
              border: isMine && !message.isDeleted ? 'none' : '1px solid var(--color-border)',
              opacity: message.isDeleted ? 0.6 : 1,
            }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{
                color: message.isDeleted
                  ? 'var(--color-ink-50)'
                  : isMine
                  ? 'var(--color-canvas)'
                  : 'var(--color-ink)',
                fontFamily: 'var(--font-sans)',
                fontStyle: message.isDeleted ? 'italic' : 'normal',
              }}
            >
              {message.isDeleted ? 'This message was deleted' : message.content.body}
            </p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-xs"
              style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
            >
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>

            {message.isEdited && !message.isDeleted && (
              <span className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                • edited
              </span>
            )}

            {isMine && !message.isDeleted && (
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


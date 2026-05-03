'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    onSend(content.trim());
    setContent('');
    setIsTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator logic
    if (!isTyping) {
      setIsTyping(true);
      // TODO: Emit typing_start event via socket
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // TODO: Emit typing_stop event via socket
    }, 2000);
  };

  const handleClear = () => {
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      {/* Attachment Button */}
      <button
        type="button"
        disabled={disabled}
        className="p-2.5 rounded-full transition-all flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-paper)',
          color: 'var(--color-ink-50)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-gold-pale)';
          e.currentTarget.style.color = 'var(--color-gold)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-paper)';
          e.currentTarget.style.color = 'var(--color-ink-50)';
        }}
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Input Container */}
      <div
        className="flex-1 flex items-end gap-2 rounded-2xl px-4 py-2"
        style={{
          backgroundColor: 'var(--color-paper)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Emoji Button */}
        <button
          type="button"
          disabled={disabled}
          className="p-1 rounded-full transition-all flex-shrink-0"
          style={{ color: 'var(--color-ink-50)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-50)')}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none py-2 text-sm max-h-[120px]"
          style={{
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {/* Clear Button */}
        {content && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full transition-all flex-shrink-0"
            style={{ color: 'var(--color-ink-50)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-50)')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={!content.trim() || disabled}
        className="p-3 rounded-full transition-all flex-shrink-0"
        style={{
          backgroundColor: content.trim() && !disabled ? 'var(--color-gold)' : 'var(--color-border)',
          color: content.trim() && !disabled ? 'var(--color-canvas)' : 'var(--color-ink-50)',
          cursor: content.trim() && !disabled ? 'pointer' : 'not-allowed',
        }}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}

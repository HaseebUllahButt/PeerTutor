'use client';

import { useState } from 'react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export default function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: CancellationModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
          Cancel Session
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
          Are you sure you want to cancel this session? This action cannot be undone.
        </p>

        <div className="mb-4">
          <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you're cancelling..."
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
            }}
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink-50)',
              fontFamily: 'var(--font-sans)',
            }}
            disabled={loading}
          >
            Keep Session
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{
              backgroundColor: '#c0392b',
              fontFamily: 'var(--font-sans)',
            }}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

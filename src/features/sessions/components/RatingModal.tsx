'use client';

import { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  loading?: boolean;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, review);
    setRating(0);
    setReview('');
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
          Rate this Session
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
          How was your tutoring experience?
        </p>

        {/* Star Rating */}
        <div className="flex gap-3 mb-6 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="text-4xl transition-all hover:scale-110"
              style={{ opacity: star <= (hoverRating || rating) ? 1 : 0.3 }}
              disabled={loading}
            >
              ★
            </button>
          ))}
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
            Share feedback (optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us what you thought about the session..."
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
            }}
            rows={3}
            disabled={loading}
            maxLength={500}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)' }}>
            {review.length}/500
          </p>
        </div>

        {/* Buttons */}
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
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{
              backgroundColor: rating > 0 ? 'var(--color-gold)' : '#ccc',
              fontFamily: 'var(--font-sans)',
              cursor: rating > 0 ? 'pointer' : 'not-allowed',
            }}
            disabled={loading || rating === 0}
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

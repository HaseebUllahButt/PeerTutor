'use client';

interface UnreadBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function UnreadBadge({
  count,
  maxCount = 99,
  size = 'md',
}: UnreadBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  const sizeClasses = {
    sm: 'min-w-[18px] h-[18px] text-[10px] px-1',
    md: 'min-w-[20px] h-[20px] text-xs px-1.5',
    lg: 'min-w-[24px] h-[24px] text-sm px-2',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]}`}
      style={{
        backgroundColor: 'var(--color-gold)',
        color: 'var(--color-canvas)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {displayCount}
    </span>
  );
}

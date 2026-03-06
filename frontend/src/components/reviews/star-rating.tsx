'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const displayValue = hovered || value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => !readonly && setHovered(0)}>
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={starValue}
            type="button"
            disabled={readonly}
            className={cn('transition-colors', !readonly && 'hover:scale-110', readonly && 'cursor-default')}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHovered(starValue)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                starValue <= displayValue ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

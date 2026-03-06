'use client';

import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from './star-rating';
import type { ReviewResponseDto } from '@/generated/api/model';

type ReviewCardProps = {
  review: ReviewResponseDto;
  currentUserId?: string;
  onEdit?: (review: ReviewResponseDto) => void;
  onDelete?: (reviewId: string) => void;
  isDeleting?: boolean;
};

export function ReviewCard({ review, currentUserId, onEdit, onDelete, isDeleting }: ReviewCardProps) {
  const isOwner = currentUserId === review.userId;

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {review.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{review.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size="sm" />
          {isOwner && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(review)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete?.(review.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{review.comment}</p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './star-rating';
import {
  useReviewsControllerCreate,
  useReviewsControllerUpdate,
} from '@/generated/api/reviews/reviews';
import type { ReviewResponseDto } from '@/generated/api/model';

type ReviewFormProps = {
  productId: string;
  existingReview?: ReviewResponseDto | null;
  onDone?: () => void;
};

export function ReviewForm({ productId, existingReview, onDone }: ReviewFormProps) {
  const isEditing = !!existingReview;
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const queryClient = useQueryClient();

  const createMutation = useReviewsControllerCreate();
  const updateMutation = useReviewsControllerUpdate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }

    try {
      if (isEditing && existingReview) {
        await updateMutation.mutateAsync({
          id: existingReview.id,
          data: { rating, comment: comment.trim() },
        });
        toast.success('Review updated');
      } else {
        await createMutation.mutateAsync({
          productId,
          data: { rating, comment: comment.trim() },
        });
        toast.success('Review submitted');
      }

      await queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setRating(0);
      setComment('');
      onDone?.();
    } catch {
      toast.error(isEditing ? 'Failed to update review' : 'Failed to submit review');
    }
  };

  return (
    <form onSubmit={e => void handleSubmit(e)} className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">{isEditing ? 'Edit your review' : 'Write a review'}</h3>
      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-comment">Comment</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience with this product (at least 10 characters)..."
          rows={4}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
        {isEditing && onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

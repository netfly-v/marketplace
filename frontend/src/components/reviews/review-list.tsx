'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from './star-rating';
import { ReviewCard } from './review-card';
import { ReviewForm } from './review-form';
import { useReviewsControllerFindByProduct, useReviewsControllerRemove } from '@/generated/api/reviews/reviews';
import type { ReviewResponseDto } from '@/generated/api/model';
import { useAuthStore } from '@/store/auth.store';

type ReviewListProps = {
  productId: string;
  avgRating?: number | null;
  reviewsCount?: number;
};

export function ReviewList({ productId, avgRating, reviewsCount = 0 }: ReviewListProps) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState<ReviewResponseDto | null>(null);

  const { data, isLoading } = useReviewsControllerFindByProduct(productId, { page, limit: 10 });
  const deleteMutation = useReviewsControllerRemove();

  const userHasReview = data?.items.some(r => r.userId === user?.id) ?? false;
  const showForm = isAuthenticated && !userHasReview && !editingReview;

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteMutation.mutateAsync({ id: reviewId });
      toast.success('Review deleted');
      await queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <Separator />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reviews</h2>
        {reviewsCount > 0 && avgRating != null && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(Number(avgRating))} readonly size="sm" />
            <span className="text-sm text-muted-foreground">
              {Number(avgRating).toFixed(1)} ({reviewsCount} review{reviewsCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {editingReview && (
        <ReviewForm productId={productId} existingReview={editingReview} onDone={() => setEditingReview(null)} />
      )}

      {showForm && <ReviewForm productId={productId} />}

      {!isAuthenticated && <p className="text-sm text-muted-foreground">Sign in to leave a review.</p>}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onEdit={r => setEditingReview(r)}
              onDelete={id => void handleDelete(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {deleteMutation.isPending && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

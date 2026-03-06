'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdersControllerFindOne } from '@/generated/api/orders/orders';
import { useAuthStore } from '@/store/auth.store';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = searchParams.get('orderId') ?? '';
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (orderId) {
      void queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      void queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    }
  }, [orderId, queryClient]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: order, isLoading } = useOrdersControllerFindOne(orderId, {
    query: {
      enabled: isAuthenticated && !!orderId,
      refetchInterval: query => (query.state.data?.status === 'PENDING' ? 2000 : false),
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : order?.status === 'PAID' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <p className="text-lg font-semibold text-foreground">Payment confirmed</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your order has been marked as paid. You can now review the full order details.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <p className="text-lg font-semibold">Payment is being confirmed</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Stripe has redirected you back successfully. The webhook may take a few seconds to mark the order as
                paid, so this page refreshes automatically.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {orderId && (
              <Button asChild>
                <Link href={`/orders/${orderId}`}>Open Order</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/orders">Go to Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutSuccessFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

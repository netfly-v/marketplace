'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentsControllerCreateCheckoutSession } from '@/generated/api/payments/payments';
import { useAuthStore } from '@/store/auth.store';

function CheckoutCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = searchParams.get('orderId') ?? '';
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const payNowMutation = usePaymentsControllerCreateCheckoutSession();

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

  const handleTryAgain = async () => {
    if (!orderId) {
      toast.error('Order ID is missing');
      return;
    }

    try {
      const session = await payNowMutation.mutateAsync({ orderId });
      toast.success('Redirecting to Stripe Checkout...');
      window.location.assign(session.checkoutUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to restart payment';
      toast.error(message);
    }
  };

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
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="h-6 w-6" />
              <p className="text-lg font-semibold text-foreground">Checkout was not completed</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your order is still pending, so you can reopen Stripe Checkout or review the order details before trying
              again.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void handleTryAgain()} disabled={payNowMutation.isPending}>
              {payNowMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Try Payment Again
            </Button>
            {orderId && (
              <Button variant="outline" asChild>
                <Link href={`/orders/${orderId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Order
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutCancelFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<CheckoutCancelFallback />}>
      <CheckoutCancelContent />
    </Suspense>
  );
}

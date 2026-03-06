'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MapPin, Package, XCircle, Clock, CheckCircle2, Truck, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdersControllerFindOne, useOrdersControllerCancel } from '@/generated/api/orders/orders';
import { useAuthStore } from '@/store/auth.store';

const PLACEHOLDER = '/placeholder-product.svg';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  PENDING: { label: 'Pending', variant: 'outline', icon: Clock },
  PAID: { label: 'Paid', variant: 'default', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', variant: 'default', icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'secondary', icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'default', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: Ban },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const { data: order, isLoading } = useOrdersControllerFindOne(id, {
    query: { enabled: isAuthenticated && !!id },
  });

  const cancelMutation = useOrdersControllerCancel();

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id });
      await queryClient.invalidateQueries({
        queryKey: [`/api/orders/${id}`],
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast.success('Order cancelled');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-40 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold">Order not found</h1>
        <Button variant="ghost" size="sm" asChild className="mt-4">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status as string] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order #{shortId(order.id)}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={statusCfg.variant} className="gap-1 px-3 py-1 text-sm">
          <StatusIcon className="h-4 w-4" />
          {statusCfg.label}
        </Badge>
      </div>

      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.shippingAddress}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Items ({order.itemsCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-4">
                <Link href={`/products/${item.productId}`} className="shrink-0">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={item.product.images?.[0] || PLACEHOLDER}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </div>
                </Link>
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {order.status === 'PENDING' && (
          <Card className="border-destructive/20 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">Cancel this order?</p>
                <p className="text-sm text-muted-foreground">Stock will be restored for all items</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelMutation.isPending}
                onClick={() => void handleCancel()}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCartControllerGetCart,
  useCartControllerUpdateItem,
  useCartControllerRemoveItem,
  useCartControllerClearCart,
} from '@/generated/api/cart/cart';
import { useAuthStore } from '@/store/auth.store';

const PLACEHOLDER = '/placeholder-product.svg';

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: cart, isLoading } = useCartControllerGetCart({
    query: { enabled: isAuthenticated },
  });

  const updateMutation = useCartControllerUpdateItem();
  const removeMutation = useCartControllerRemoveItem();
  const clearMutation = useCartControllerClearCart();

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ['/api/cart'] });

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateMutation.mutateAsync({ id: itemId, data: { quantity } });
      await invalidateCart();
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeMutation.mutateAsync({ id: itemId });
      await invalidateCart();
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearMutation.mutateAsync();
      await invalidateCart();
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
      </Button>

      <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-sm text-muted-foreground">Add some products to get started</p>
          <Button asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Catalog
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cart.items.map(item => (
              <Card key={item.id} className="shadow-sm">
                <CardContent className="flex gap-4 p-4">
                  <Link href={`/products/${item.productId}`} className="shrink-0">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.product.images?.[0] || PLACEHOLDER}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-semibold transition-colors hover:text-primary"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)} each</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={item.quantity <= 1 || updateMutation.isPending}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={item.quantity >= item.product.stock || updateMutation.isPending}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        {item.product.stock <= 5 && (
                          <span className="text-xs text-muted-foreground">{item.product.stock} left</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={removeMutation.isPending}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCart}
              disabled={clearMutation.isPending}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cart
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-sm">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items ({cart.itemsCount})</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

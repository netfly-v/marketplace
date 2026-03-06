'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Loader2, MapPin, Phone, ShoppingBag, Package, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useCartControllerGetCart } from '@/generated/api/cart/cart';
import { useOrdersControllerCreate } from '@/generated/api/orders/orders';
import { useAuthStore } from '@/store/auth.store';

const PLACEHOLDER = '/placeholder-product.svg';

type CheckoutFormValues = {
  recipientName: string;
  phone: string;
  country: string;
  city: string;
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  deliveryInstructions?: string;
};

const schema: yup.ObjectSchema<CheckoutFormValues> = yup.object({
  recipientName: yup
    .string()
    .min(2, 'Recipient name must be at least 2 characters')
    .required('Recipient name is required'),
  phone: yup
    .string()
    .min(7, 'Phone must be at least 7 characters')
    .required('Phone is required'),
  country: yup
    .string()
    .min(2, 'Country must be at least 2 characters')
    .required('Country is required'),
  city: yup
    .string()
    .min(2, 'City must be at least 2 characters')
    .required('City is required'),
  streetLine1: yup
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .required('Street address is required'),
  streetLine2: yup.string().optional(),
  postalCode: yup
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .required('Postal code is required'),
  deliveryInstructions: yup.string().optional(),
});

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: cart, isLoading: cartLoading } = useCartControllerGetCart({
    query: { enabled: isAuthenticated },
  });

  const createOrderMutation = useOrdersControllerCreate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      recipientName: '',
      phone: '',
      country: '',
      city: '',
      streetLine1: '',
      streetLine2: '',
      postalCode: '',
      deliveryInstructions: '',
    },
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    try {
      const result = await createOrderMutation.mutateAsync({
        data: {
          shippingAddress: {
            recipientName: values.recipientName,
            phone: values.phone,
            country: values.country,
            city: values.city,
            streetLine1: values.streetLine1,
            streetLine2: values.streetLine2 || undefined,
            postalCode: values.postalCode,
            deliveryInstructions: values.deliveryInstructions || undefined,
          },
        },
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.setQueryData([`/api/orders/${result.order.id}`], result.order);
      toast.success('Redirecting to Stripe Checkout...');
      window.location.assign(result.checkoutUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
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

  if (cartLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-sm text-muted-foreground">Add some products before checking out</p>
          <Button asChild>
            <Link href="/products">Browse Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/cart">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
      </Button>

      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <form onSubmit={e => void handleSubmit(onSubmit)(e)}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5" />
                  Recipient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Full name</Label>
                  <Input
                    id="recipientName"
                    {...register('recipientName')}
                    placeholder="Alex Johnson"
                  />
                  {errors.recipientName && (
                    <p className="text-sm text-destructive">{errors.recipientName.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+1 555 123 4567"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder="United States"
                    />
                    {errors.country && (
                      <p className="text-sm text-destructive">{errors.country.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetLine1">Street address</Label>
                  <Input
                    id="streetLine1"
                    {...register('streetLine1')}
                    placeholder="123 Main Street"
                  />
                  {errors.streetLine1 && (
                    <p className="text-sm text-destructive">{errors.streetLine1.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetLine2">Apartment, suite, floor</Label>
                  <Input
                    id="streetLine2"
                    {...register('streetLine2')}
                    placeholder="Apt 4B"
                  />
                  {errors.streetLine2 && (
                    <p className="text-sm text-destructive">{errors.streetLine2.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input
                    id="postalCode"
                    {...register('postalCode')}
                    placeholder="10001"
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery instructions</Label>
                  <Textarea
                    id="deliveryInstructions"
                    {...register('deliveryInstructions')}
                    placeholder="Leave the package with the concierge"
                  />
                  {errors.deliveryInstructions && (
                    <p className="text-sm text-destructive">
                      {errors.deliveryInstructions.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({cart.itemsCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.product.images?.[0] || PLACEHOLDER}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-medium">{item.product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} &times; ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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
                <Button type="submit" size="lg" className="w-full" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue to Payment
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  You will be redirected to Stripe Checkout to complete payment securely
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Save, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsersControllerGetProfile, useUsersControllerUpdateProfile } from '@/generated/api/users/users';
import { useAuthStore } from '@/store/auth.store';

type ProfileFormValues = {
  name: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingCountry?: string;
  shippingCity?: string;
  shippingStreetLine1?: string;
  shippingStreetLine2?: string;
  shippingPostalCode?: string;
  shippingDeliveryInstructions?: string;
};

const schema: yup.ObjectSchema<ProfileFormValues> = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  shippingName: yup.string().optional(),
  shippingPhone: yup.string().optional(),
  shippingCountry: yup.string().optional(),
  shippingCity: yup.string().optional(),
  shippingStreetLine1: yup.string().optional(),
  shippingStreetLine2: yup.string().optional(),
  shippingPostalCode: yup.string().optional(),
  shippingDeliveryInstructions: yup.string().optional(),
});

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: profile, isLoading: profileLoading } = useUsersControllerGetProfile({
    query: { enabled: isAuthenticated },
  });

  const updateMutation = useUsersControllerUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        shippingName: profile.shippingName ?? '',
        shippingPhone: profile.shippingPhone ?? '',
        shippingCountry: profile.shippingCountry ?? '',
        shippingCity: profile.shippingCity ?? '',
        shippingStreetLine1: profile.shippingStreetLine1 ?? '',
        shippingStreetLine2: profile.shippingStreetLine2 ?? '',
        shippingPostalCode: profile.shippingPostalCode ?? '',
        shippingDeliveryInstructions: profile.shippingDeliveryInstructions ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateMutation.mutateAsync({
        data: {
          name: values.name,
          shippingName: values.shippingName || undefined,
          shippingPhone: values.shippingPhone || undefined,
          shippingCountry: values.shippingCountry || undefined,
          shippingCity: values.shippingCity || undefined,
          shippingStreetLine1: values.shippingStreetLine1 || undefined,
          shippingStreetLine2: values.shippingStreetLine2 || undefined,
          shippingPostalCode: values.shippingPostalCode || undefined,
          shippingDeliveryInstructions: values.shippingDeliveryInstructions || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Profile</h1>

      <form onSubmit={e => void handleSubmit(onSubmit)(e)}>
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Default Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Save your shipping address to auto-fill it during checkout.
              </p>
              <div className="space-y-2">
                <Label htmlFor="shippingName">Recipient name</Label>
                <Input id="shippingName" {...register('shippingName')} placeholder="Alex Johnson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingPhone">Phone</Label>
                <Input id="shippingPhone" {...register('shippingPhone')} placeholder="+1 555 123 4567" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Input id="shippingCountry" {...register('shippingCountry')} placeholder="United States" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input id="shippingCity" {...register('shippingCity')} placeholder="New York" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingStreetLine1">Street address</Label>
                <Input id="shippingStreetLine1" {...register('shippingStreetLine1')} placeholder="123 Main Street" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingStreetLine2">Apartment, suite, floor</Label>
                <Input id="shippingStreetLine2" {...register('shippingStreetLine2')} placeholder="Apt 4B" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingPostalCode">Postal code</Label>
                <Input id="shippingPostalCode" {...register('shippingPostalCode')} placeholder="10001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingDeliveryInstructions">Delivery instructions</Label>
                <Textarea
                  id="shippingDeliveryInstructions"
                  {...register('shippingDeliveryInstructions')}
                  placeholder="Leave with the concierge"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={updateMutation.isPending || !isDirty}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

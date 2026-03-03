'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ProductForm } from '@/components/products/product-form';
import { useAuthStore } from '@/store/auth.store';

export default function NewProductPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSeller)) {
      router.replace('/products');
    }
  }, [isLoading, isAuthenticated, isSeller, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !isSeller) return null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <ProductForm />
    </div>
  );
}

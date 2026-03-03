'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package } from 'lucide-react';
import { useProductsControllerFindOne } from '@/generated/api/products/products';
import { ProductForm } from '@/components/products/product-form';
import { useAuthStore } from '@/store/auth.store';

export default function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: product, isLoading: productLoading } = useProductsControllerFindOne(id);
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  const canEdit = user && product && (user.id === product.sellerId || user.role === 'ADMIN');

  useEffect(() => {
    if (!authLoading && !productLoading) {
      if (!isAuthenticated || (product && !canEdit)) {
        router.replace(`/products/${id}`);
      }
    }
  }, [authLoading, productLoading, isAuthenticated, canEdit, router, id, product]);

  if (authLoading || productLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Product not found</h2>
      </div>
    );
  }

  if (!canEdit) return null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <ProductForm product={product} />
    </div>
  );
}

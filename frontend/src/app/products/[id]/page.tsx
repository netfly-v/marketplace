'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Package, ShoppingCart, Pencil } from 'lucide-react';
import { useProductsControllerFindOne } from '@/generated/api/products/products';
import { ProductImageGallery } from '@/components/products/product-image-gallery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth.store';

export default function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: product, isLoading, isError } = useProductsControllerFindOne(id);
  const { user } = useAuthStore();

  const canEdit = user && product && (user.id === product.sellerId || user.role === 'ADMIN');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24">
        <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Product not found</h2>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to catalog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to catalog
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image gallery */}
        <ProductImageGallery images={product.images} title={product.title} />

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <Link
              href={`/products?categoryId=${product.categoryId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {product.category?.name}
            </Link>
            <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>
          </div>

          {/* Rating */}
          {product.avgRating != null && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(Number(product.avgRating) || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {Number(product.avgRating).toFixed(1)} ({product.reviewsCount} review
                {product.reviewsCount !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="text-3xl font-bold">${product.price.toFixed(2)}</div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                In stock ({product.stock})
              </Badge>
            ) : (
              <Badge variant="destructive">Out of stock</Badge>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{product.description}</p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button size="lg" disabled={product.stock === 0} className="flex-1">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            {canEdit && (
              <Button variant="outline" size="lg" asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>

          {/* Seller info */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Sold by</p>
            <p className="font-medium">{product.seller?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

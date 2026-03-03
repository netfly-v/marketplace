'use client';

import { Suspense, use } from 'react';
import { Package } from 'lucide-react';
import { useProductsControllerFindAll } from '@/generated/api/products/products';
import type { ProductsControllerFindAllParams } from '@/generated/api/model';
import { ProductCard } from '@/components/products/product-card';
import { ProductFilters } from '@/components/products/product-filters';
import { ProductSort } from '@/components/products/product-sort';
import { ProductPagination } from '@/components/products/product-pagination';
import { Skeleton } from '@/components/ui/skeleton';

function CatalogContent({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const params: ProductsControllerFindAllParams = {
    search: (searchParams.search as string) || undefined,
    categoryId: (searchParams.categoryId as string) || undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sortBy: (searchParams.sortBy as ProductsControllerFindAllParams['sortBy']) || undefined,
    sortOrder: (searchParams.sortOrder as ProductsControllerFindAllParams['sortOrder']) || undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
    limit: 12,
  };

  const { data, isLoading } = useProductsControllerFindAll(params);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <div className="hidden w-60 shrink-0 lg:block">
          <Suspense>
            <ProductFilters />
          </Suspense>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Catalog</h1>
              {data && (
                <p className="text-sm text-muted-foreground">
                  {data.total} product{data.total !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            <Suspense>
              <ProductSort />
            </Suspense>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-8">
                <Suspense>
                  <ProductPagination page={data.page} totalPages={data.totalPages} />
                </Suspense>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="text-lg font-semibold">No products found</h2>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = use(props.searchParams);

  return (
    <Suspense>
      <CatalogContent searchParams={searchParams} />
    </Suspense>
  );
}

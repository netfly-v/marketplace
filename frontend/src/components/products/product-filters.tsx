'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesControllerFindAll } from '@/generated/api/categories/categories';

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories, isLoading } = useCategoriesControllerFindAll();

  const currentCategory = searchParams.get('categoryId') ?? '';
  const currentMinPrice = searchParams.get('minPrice') ?? '';
  const currentMaxPrice = searchParams.get('maxPrice') ?? '';

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('page', '1');
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push('/products');
  }, [router]);

  const hasFilters = currentCategory || currentMinPrice || currentMaxPrice;

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 font-semibold">Categories</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <Button
              variant={!currentCategory ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => updateFilter('categoryId', '')}
            >
              All categories
            </Button>
            {categories?.map(cat => (
              <div key={cat.id}>
                <Button
                  variant={currentCategory === cat.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start font-medium"
                  onClick={() => updateFilter('categoryId', cat.id)}
                >
                  {cat.name}
                </Button>
                {cat.children?.map(child => (
                  <Button
                    key={child.id}
                    variant={currentCategory === child.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start pl-6 text-muted-foreground"
                    onClick={() => updateFilter('categoryId', child.id)}
                  >
                    {child.name}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 font-semibold">Price Range</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="minPrice" className="text-xs text-muted-foreground">
              Min
            </Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="0"
              min={0}
              value={currentMinPrice}
              onChange={e => updateFilter('minPrice', e.target.value)}
            />
          </div>
          <span className="mt-5 text-muted-foreground">—</span>
          <div className="flex-1">
            <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">
              Max
            </Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Any"
              min={0}
              value={currentMaxPrice}
              onChange={e => updateFilter('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </div>

      {hasFilters && (
        <>
          <Separator />
          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
            Clear all filters
          </Button>
        </>
      )}
    </aside>
  );
}

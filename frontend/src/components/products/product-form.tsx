'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Loader2, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/products/image-upload';
import { useCategoriesControllerFindAll } from '@/generated/api/categories/categories';
import { useProductsControllerCreate, useProductsControllerUpdate } from '@/generated/api/products/products';
import type { ProductResponseDto } from '@/generated/api/model';

const schema = yup.object({
  title: yup.string().min(3, 'At least 3 characters').required('Title is required'),
  description: yup.string().min(10, 'At least 10 characters').required('Description is required'),
  price: yup.number().min(0.01, 'Price must be > 0').required('Price is required'),
  stock: yup.number().min(0).integer().default(0),
  categoryId: yup.string().required('Category is required'),
  images: yup.array().of(yup.string().required()).default([]),
  isPublished: yup.boolean().default(false),
});

type FormValues = yup.InferType<typeof schema>;

interface ProductFormProps {
  product?: ProductResponseDto;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!product;
  const publishIntentRef = useRef(true);

  const { data: categories } = useCategoriesControllerFindAll();
  const createMutation = useProductsControllerCreate();
  const updateMutation = useProductsControllerUpdate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: product?.title ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      categoryId: product?.categoryId ?? '',
      images: product?.images ?? [],
      isPublished: product?.isPublished ?? false,
    },
  });

  const allCategories = categories?.flatMap(cat => [cat, ...(cat.children ?? [])]) ?? [];

  const invalidateProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  };

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, isPublished: isEditing ? values.isPublished : publishIntentRef.current };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: product.id, data: payload });
        await Promise.all([
          invalidateProducts(),
          queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] }),
        ]);
        toast.success('Product updated');
        router.push(`/products/${product.id}`);
      } else {
        const created = await createMutation.mutateAsync({ data: payload });
        await invalidateProducts();

        if (payload.isPublished) {
          toast.success('Product published!');
        } else {
          toast.success("Product saved as draft. It won't appear in the catalog until published.");
        }
        router.push(`/products/${created.id}`);
      }
    } catch {
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Product' : 'New Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} placeholder="Product title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Product description" rows={4} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} placeholder="0.00" />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" {...register('stock')} placeholder="0" />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="images"
            control={control}
            render={({ field }) => <ImageUpload images={field.value ?? []} onChange={field.onChange} />}
          />
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-xs text-muted-foreground">Only published products are visible in the catalog</p>
              </div>
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <button type="button" onClick={() => field.onChange(!field.value)} className="transition-colors">
                    <Badge variant={field.value ? 'default' : 'secondary'}>{field.value ? 'Published' : 'Draft'}</Badge>
                  </button>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {isEditing ? (
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              onClick={() => {
                publishIntentRef.current = true;
              }}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              variant="secondary"
              onClick={() => {
                publishIntentRef.current = false;
              }}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
          </>
        )}
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {!isEditing && (
        <p className="text-xs text-muted-foreground">
          Published products appear immediately in the catalog. Drafts are saved but not visible to buyers.
        </p>
      )}
    </form>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { useUploadControllerUploadImages } from '@/generated/api/upload/upload';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadControllerUploadImages();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);

      const validFiles = toUpload.filter(f => {
        if (!f.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          toast.error(`${f.name}: only JPEG, PNG, WebP are allowed`);
          return false;
        }
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`${f.name}: max file size is 5MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      try {
        const result = await uploadMutation.mutateAsync({
          data: { files: validFiles as unknown as Blob[] },
        });
        onChange([...images, ...result.urls]);
        toast.success(`${result.urls.length} image(s) uploaded`);
      } catch {
        toast.error('Failed to upload images');
      }
    },
    [images, maxImages, onChange, uploadMutation]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      {/* Preview existing images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
              <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" sizes="96px" unoptimized />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/jpeg,image/png,image/webp';
            input.onchange = e => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleFiles(files);
            };
            input.click();
          }}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {uploadMutation.isPending ? 'Uploading...' : 'Drop images here or click to browse'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP up to 5MB. Max {maxImages} images.</p>
        </div>
      )}
    </div>
  );
}

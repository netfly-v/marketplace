"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductResponseDto } from "@/generated/api/model";

const PLACEHOLDER = "/placeholder-product.svg";

interface ProductCardProps {
  product: ProductResponseDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(
    product.images?.[0] || PLACEHOLDER,
  );

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group cursor-pointer overflow-hidden shadow-sm transition-shadow hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
            onError={() => setImgSrc(PLACEHOLDER)}
          />
          {product.stock === 0 && (
            <Badge variant="destructive" className="absolute right-2 top-2">
              Out of stock
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-1 text-xs text-muted-foreground">
            {product.category?.name}
          </div>
          <h3 className="line-clamp-1 font-semibold">{product.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
            {product.avgRating != null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{Number(product.avgRating).toFixed(1)}</span>
                <span>({product.reviewsCount})</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            by {product.seller?.name}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

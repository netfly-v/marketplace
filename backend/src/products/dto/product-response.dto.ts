import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSellerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ProductCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty()
  sellerId: string;

  @ApiProperty({ type: ProductSellerDto })
  seller: ProductSellerDto;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ type: ProductCategoryDto })
  category: ProductCategoryDto;

  @ApiPropertyOptional({ description: 'Number of reviews' })
  reviewsCount?: number;

  @ApiPropertyOptional({ description: 'Average rating (1-5)' })
  avgRating?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items: ProductResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 9 })
  totalPages: number;
}

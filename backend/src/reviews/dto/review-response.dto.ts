import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';

export class ReviewUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  avatar: string | null;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty({ enum: ReviewStatus })
  status: ReviewStatus;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: ReviewUserDto })
  user: ReviewUserDto;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  items: ReviewResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

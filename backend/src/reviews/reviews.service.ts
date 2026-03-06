import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ReviewStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { UpdateReviewDto } from './dto/update-review.dto';
import type { ReviewQueryDto } from './dto/review-query.dto';
import type { ModerateReviewDto } from './dto/moderate-review.dto';
import type {
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
} from './dto/review-response.dto';

const REVIEW_USER_SELECT = {
  id: true,
  name: true,
  avatar: true,
} as const;

type RawReview = {
  id: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  userId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatar: string | null };
};

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    userId: string,
    productId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isPublished) {
      throw new BadRequestException('Cannot review an unpublished product');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          rating: dto.rating,
          comment: dto.comment,
          status: ReviewStatus.APPROVED,
          userId,
          productId,
        },
        include: { user: { select: REVIEW_USER_SELECT } },
      });

      return this.formatReviewResponse(review);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('You have already reviewed this product');
      }
      throw error;
    }
  }

  async getProductReviews(
    productId: string,
    query: ReviewQueryDto,
  ): Promise<PaginatedReviewsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      productId,
      status: ReviewStatus.APPROVED,
    };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: REVIEW_USER_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatReviewResponse(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateReview(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
      include: { user: { select: REVIEW_USER_SELECT } },
    });

    return this.formatReviewResponse(updated);
  }

  async deleteReview(
    userId: string,
    userRole: string,
    reviewId: string,
  ): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
  }

  async moderateReview(
    reviewId: string,
    dto: ModerateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: dto.status },
      include: { user: { select: REVIEW_USER_SELECT } },
    });

    return this.formatReviewResponse(updated);
  }

  private formatReviewResponse(review: RawReview): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      userId: review.userId,
      user: {
        id: review.user.id,
        name: review.user.name,
        avatar: review.user.avatar,
      },
      productId: review.productId,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import {
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
} from './dto/review-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-request.type';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 201,
    description: 'Review created',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error / Unpublished product',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Already reviewed this product' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(userId, productId, dto);
  }

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get paginated reviews for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of approved reviews',
    type: PaginatedReviewsResponseDto,
  })
  async findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: ReviewQueryDto,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewsService.getProductReviews(productId, query);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({
    status: 200,
    description: 'Review updated',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the review owner' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.updateReview(userId, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own review (or admin can delete any)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the review owner / Not admin' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.reviewsService.deleteReview(user.id, user.role, id);
  }

  @Patch('reviews/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a review (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({
    status: 200,
    description: 'Review status updated',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.moderateReview(id, dto);
  }
}

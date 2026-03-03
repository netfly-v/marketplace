import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductQueryDto,
  ProductSortBy,
  SortOrder,
} from './dto/product-query.dto';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

const productInclude = {
  seller: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const {
      search,
      categoryId,
      sellerId,
      minPrice,
      maxPrice,
      sortBy = ProductSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 12,
    } = query;

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const itemsWithRatings = await Promise.all(
      items.map(async (product) => {
        const agg = await this.prisma.review.aggregate({
          where: { productId: product.id },
          _avg: { rating: true },
        });
        return {
          ...product,
          reviewsCount: product._count.reviews,
          avgRating: agg._avg.rating,
          _count: undefined,
        };
      }),
    );

    return {
      items: itemsWithRatings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    const agg = await this.prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
    });

    return {
      ...product,
      reviewsCount: product._count.reviews,
      avgRating: agg._avg.rating,
      _count: undefined,
    };
  }

  async create(dto: CreateProductDto, sellerId: string) {
    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        images: dto.images ?? [],
        stock: dto.stock ?? 0,
        isPublished: dto.isPublished ?? false,
        sellerId,
        categoryId: dto.categoryId,
      },
      include: productInclude,
    });
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    userRole: Role,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    if (product.sellerId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: productInclude,
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    if (product.sellerId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted successfully' };
  }
}

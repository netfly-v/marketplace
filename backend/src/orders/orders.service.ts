import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import type {
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  stock: true,
                  images: true,
                  isPublished: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      for (const item of cart.items) {
        if (!item.product.isPublished) {
          throw new BadRequestException(
            `Product "${item.product.title}" is no longer available`,
          );
        }
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for "${item.product.title}". Available: ${item.product.stock}, requested: ${item.quantity}`,
          );
        }
      }

      const total = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0,
      );

      const order = await tx.order.create({
        data: {
          userId,
          total: Math.round(total * 100) / 100,
          shippingAddress: dto.shippingAddress,
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, title: true, images: true } },
            },
          },
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return this.formatOrderResponse(order);
    });
  }

  async getOrders(
    userId: string,
    query: OrderQueryDto,
  ): Promise<PaginatedOrdersResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, title: true, images: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.formatOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true, images: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return this.formatOrderResponse(order);
  }

  async cancelOrder(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          items: {
            include: {
              product: { select: { id: true, title: true, images: true } },
            },
          },
        },
      });

      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return this.formatOrderResponse(updated);
    });
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true, images: true } },
          },
        },
      },
    });

    return this.formatOrderResponse(updated);
  }

  private formatOrderResponse(order: {
    id: string;
    status: OrderStatus;
    total: number;
    shippingAddress: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      productId: string;
      product: { id: string; title: string; images: string[] };
    }>;
  }): OrderResponseDto {
    const items = order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      productId: item.productId,
      product: item.product,
      subtotal: Math.round(item.quantity * item.price * 100) / 100,
    }));

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      shippingAddress: order.shippingAddress,
      userId: order.userId,
      items,
      itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

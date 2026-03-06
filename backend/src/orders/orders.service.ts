import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto, ShippingAddressDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import type {
  CreateOrderCheckoutResponseDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
  ShippingAddressResponseDto,
} from './dto/order-response.dto';

type CheckoutCartItemSnapshot = {
  productId: string;
  title: string;
  images: string[];
  quantity: number;
  price: number;
};

type CheckoutCartSnapshot = {
  cartId: string;
  userEmail: string;
  items: CheckoutCartItemSnapshot[];
  total: number;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
    frontendOrigin?: string,
  ): Promise<CreateOrderCheckoutResponseDto> {
    const cartSnapshot = await this.getCheckoutCartSnapshot(userId);
    const orderId = randomUUID();

    const session = await this.paymentsService.createCheckoutSession({
      orderId,
      userId,
      userEmail: cartSnapshot.userEmail,
      frontendOrigin,
      items: cartSnapshot.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const currentCart = await tx.cart.findUnique({
          where: { userId },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    stock: true,
                    isPublished: true,
                  },
                },
              },
            },
          },
        });

        this.assertCartSnapshotMatches(currentCart, cartSnapshot);

        const order = await tx.order.create({
          data: {
            id: orderId,
            userId,
            total: cartSnapshot.total,
            ...this.mapShippingAddress(dto.shippingAddress),
            items: {
              create: cartSnapshot.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
            payment: {
              create: {
                amount: cartSnapshot.total,
                currency: session.currency,
                status: PaymentStatus.PENDING,
                stripeCheckoutSessionId: session.sessionId,
                stripePaymentIntentId: session.paymentIntentId ?? undefined,
              },
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

        for (const item of cartSnapshot.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        await tx.cartItem.deleteMany({
          where: { cartId: cartSnapshot.cartId },
        });

        return order;
      });

      return {
        order: this.formatOrderResponse(order),
        checkoutUrl: session.checkoutUrl,
      };
    } catch (error) {
      await this.paymentsService.expireCheckoutSession(session.sessionId);
      throw error;
    }
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
      include: { items: true, payment: true },
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

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
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

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      if (order.payment && order.payment.status !== PaymentStatus.SUCCEEDED) {
        await tx.payment.update({
          where: { orderId },
          data: { status: PaymentStatus.FAILED },
        });
      }

      return this.formatOrderResponse(updated);
    });

    await this.paymentsService.expireCheckoutSession(
      order.payment?.stripeCheckoutSessionId,
    );

    return updatedOrder;
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
    recipientName: string;
    phone: string;
    country: string;
    city: string;
    streetLine1: string;
    streetLine2: string | null;
    postalCode: string;
    deliveryInstructions: string | null;
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
      shippingAddress: {
        recipientName: order.recipientName,
        phone: order.phone,
        country: order.country,
        city: order.city,
        streetLine1: order.streetLine1,
        streetLine2: order.streetLine2,
        postalCode: order.postalCode,
        deliveryInstructions: order.deliveryInstructions,
      },
      userId: order.userId,
      items,
      itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async getCheckoutCartSnapshot(
    userId: string,
  ): Promise<CheckoutCartSnapshot> {
    const [user, cart] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
      this.prisma.cart.findUnique({
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
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    this.validateCartItems(
      cart.items.map((item) => ({
        title: item.product.title,
        stock: item.product.stock,
        isPublished: item.product.isPublished,
        quantity: item.quantity,
      })),
    );

    const items = cart.items.map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      images: item.product.images,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const total =
      Math.round(
        items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100,
      ) / 100;

    return {
      cartId: cart.id,
      userEmail: user.email,
      items,
      total,
    };
  }

  private assertCartSnapshotMatches(
    cart: {
      id: string;
      items: Array<{
        quantity: number;
        productId: string;
        product: {
          title: string;
          stock: number;
          isPublished: boolean;
        };
      }>;
    } | null,
    snapshot: CheckoutCartSnapshot,
  ): void {
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (cart.items.length !== snapshot.items.length) {
      throw new BadRequestException(
        'Cart changed during checkout. Please review your cart and try again.',
      );
    }

    const snapshotMap = new Map(
      snapshot.items.map((item) => [item.productId, item.quantity]),
    );

    for (const item of cart.items) {
      const expectedQuantity = snapshotMap.get(item.productId);

      if (expectedQuantity !== item.quantity) {
        throw new BadRequestException(
          'Cart changed during checkout. Please review your cart and try again.',
        );
      }
    }

    this.validateCartItems(
      cart.items.map((item) => ({
        title: item.product.title,
        stock: item.product.stock,
        isPublished: item.product.isPublished,
        quantity: item.quantity,
      })),
    );
  }

  private validateCartItems(
    items: Array<{
      title: string;
      stock: number;
      isPublished: boolean;
      quantity: number;
    }>,
  ): void {
    for (const item of items) {
      if (!item.isPublished) {
        throw new BadRequestException(
          `Product "${item.title}" is no longer available`,
        );
      }
      if (item.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for "${item.title}". Available: ${item.stock}, requested: ${item.quantity}`,
        );
      }
    }
  }

  private mapShippingAddress(
    shippingAddress: ShippingAddressDto,
  ): ShippingAddressResponseDto {
    return {
      recipientName: shippingAddress.recipientName,
      phone: shippingAddress.phone,
      country: shippingAddress.country,
      city: shippingAddress.city,
      streetLine1: shippingAddress.streetLine1,
      streetLine2: shippingAddress.streetLine2 ?? null,
      postalCode: shippingAddress.postalCode,
      deliveryInstructions: shippingAddress.deliveryInstructions ?? null,
    };
  }
}

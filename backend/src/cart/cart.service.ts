import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import type { CartResponseDto } from './dto/cart-response.dto';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const fullCart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });

    const items = fullCart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      productId: item.productId,
      product: item.product,
      subtotal: item.quantity * item.product.price,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: fullCart.id,
      items,
      itemsCount,
      total: Math.round(total * 100) / 100,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isPublished) {
      throw new BadRequestException('Product is not available');
    }

    const quantity = dto.quantity ?? 1;

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Not enough stock. Available: ${product.stock}`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        throw new BadRequestException(
          `Not enough stock. Available: ${product.stock}, in cart: ${existing.quantity}`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { select: { stock: true } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity > item.product.stock) {
      throw new BadRequestException(
        `Not enough stock. Available: ${item.product.stock}`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }
}

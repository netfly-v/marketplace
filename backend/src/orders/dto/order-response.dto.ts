import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class ShippingAddressResponseDto {
  @ApiProperty()
  recipientName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  streetLine1: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  streetLine2: string | null;

  @ApiProperty()
  postalCode: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  deliveryInstructions: string | null;
}

class OrderItemProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [String] })
  images: string[];
}

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ description: 'Price per unit at the time of order' })
  price: number;

  @ApiProperty()
  productId: string;

  @ApiProperty({ type: OrderItemProductDto })
  product: OrderItemProductDto;

  @ApiProperty({ description: 'quantity * price' })
  subtotal: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: ShippingAddressResponseDto })
  shippingAddress: ShippingAddressResponseDto;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  itemsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateOrderCheckoutResponseDto {
  @ApiProperty({ type: OrderResponseDto })
  order: OrderResponseDto;

  @ApiProperty({
    description: 'Hosted Stripe Checkout URL where the client should redirect',
  })
  checkoutUrl: string;
}

export class PaginatedOrdersResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  items: OrderResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

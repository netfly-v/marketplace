import { ApiProperty } from '@nestjs/swagger';

class CartItemProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  stock: number;
}

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  productId: string;

  @ApiProperty({ type: CartItemProductDto })
  product: CartItemProductDto;

  @ApiProperty({ description: 'quantity * product.price' })
  subtotal: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ description: 'Total number of items' })
  itemsCount: number;

  @ApiProperty({ description: 'Sum of all subtotals' })
  total: number;
}

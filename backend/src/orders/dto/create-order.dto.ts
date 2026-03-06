import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: '123 Main St, New York, NY 10001',
    description: 'Shipping address for the order',
  })
  @IsString()
  @MinLength(5, { message: 'Shipping address must be at least 5 characters' })
  shippingAddress: string;
}

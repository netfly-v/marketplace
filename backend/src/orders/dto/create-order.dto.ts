import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({
    example: 'Alex Johnson',
    description: 'Recipient full name',
  })
  @IsString()
  @MinLength(2, { message: 'Recipient name must be at least 2 characters' })
  recipientName: string;

  @ApiProperty({
    example: '+1 555 123 4567',
    description: 'Phone number for delivery coordination',
  })
  @IsString()
  @MinLength(7, { message: 'Phone must be at least 7 characters' })
  phone: string;

  @ApiProperty({
    example: 'United States',
    description: 'Shipping country',
  })
  @IsString()
  @MinLength(2, { message: 'Country must be at least 2 characters' })
  country: string;

  @ApiProperty({
    example: 'New York',
    description: 'Shipping city',
  })
  @IsString()
  @MinLength(2, { message: 'City must be at least 2 characters' })
  city: string;

  @ApiProperty({
    example: '123 Main St, Apt 4B',
    description: 'Primary street line',
  })
  @IsString()
  @MinLength(5, { message: 'Street line 1 must be at least 5 characters' })
  streetLine1: string;

  @ApiPropertyOptional({
    example: 'Building B, Floor 3',
    description: 'Secondary street line or apartment details',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Street line 2 must be at least 2 characters' })
  streetLine2?: string;

  @ApiProperty({
    example: '10001',
    description: 'Postal or ZIP code',
  })
  @IsString()
  @MinLength(3, { message: 'Postal code must be at least 3 characters' })
  postalCode: string;

  @ApiPropertyOptional({
    example: 'Leave the package with the concierge',
    description: 'Optional delivery instructions',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, {
    message: 'Delivery instructions must be at least 3 characters',
  })
  deliveryInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    type: ShippingAddressDto,
    description: 'Structured shipping snapshot for this order',
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}

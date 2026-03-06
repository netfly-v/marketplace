import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    minLength: 2,
    description: 'Updated display name',
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
    description: 'Avatar image URL',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Alex Johnson' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  shippingName?: string;

  @ApiPropertyOptional({ example: '+1 555 123 4567' })
  @IsString()
  @MinLength(7)
  @IsOptional()
  shippingPhone?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  shippingCountry?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @MinLength(5)
  @IsOptional()
  shippingStreetLine1?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsString()
  @IsOptional()
  shippingStreetLine2?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  @MinLength(3)
  @IsOptional()
  shippingPostalCode?: string;

  @ApiPropertyOptional({ example: 'Leave with concierge' })
  @IsString()
  @IsOptional()
  shippingDeliveryInstructions?: string;
}

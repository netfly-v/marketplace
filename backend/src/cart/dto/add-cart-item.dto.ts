import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @ApiProperty({ example: 'uuid-of-product', description: 'Product UUID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  quantity?: number;
}

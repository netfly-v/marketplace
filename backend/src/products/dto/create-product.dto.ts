import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  Min,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones', minLength: 3 })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'Premium noise-cancelling headphones',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 79.99, minimum: 0.01 })
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  price: number;

  @ApiPropertyOptional({
    example: ['http://localhost:9000/marketplace-images/abc.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: 50, minimum: 0, default: 0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: 'clx1234...' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

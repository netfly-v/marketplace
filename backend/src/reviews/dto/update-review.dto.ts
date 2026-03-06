import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Min,
  Max,
  MinLength,
  IsOptional,
} from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Rating from 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Review comment', minLength: 10 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  comment?: string;
}

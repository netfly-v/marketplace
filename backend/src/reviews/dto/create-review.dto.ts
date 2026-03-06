import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, MinLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment', minLength: 10 })
  @IsString()
  @MinLength(10)
  comment: string;
}

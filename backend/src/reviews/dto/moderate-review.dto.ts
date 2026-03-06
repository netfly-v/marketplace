import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class ModerateReviewDto {
  @ApiProperty({
    enum: ReviewStatus,
    description: 'New review status',
  })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}

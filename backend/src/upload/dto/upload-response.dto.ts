import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Array of uploaded image URLs',
    example: ['http://localhost:9000/marketplace-images/abc-123.jpg'],
    type: [String],
  })
  urls: string[];
}

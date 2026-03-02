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
}

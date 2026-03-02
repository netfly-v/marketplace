import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({
    nullable: true,
    example: 'https://cdn.example.com/avatar.png',
    required: false,
  })
  avatar: string | null;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: false })
  isBlocked: boolean;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-10T10:00:00.000Z' })
  updatedAt: Date;
}

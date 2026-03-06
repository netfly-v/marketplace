import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'Hosted Stripe Checkout URL where the client should redirect',
  })
  checkoutUrl: string;
}

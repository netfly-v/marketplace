import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-request.type';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { PaymentsService } from './payments.service';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private resolveFrontendOrigin(req: Request): string | undefined {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && origin.length > 0) {
      return origin;
    }

    const referer = req.headers.referer;
    if (typeof referer === 'string' && referer.length > 0) {
      try {
        return new URL(referer).origin;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean', example: true },
      },
    },
  })
  async handleWebhook(
    @Headers('stripe-signature') signature: string | string[] | undefined,
    @Req() req: RawBodyRequest,
  ) {
    await this.paymentsService.handleWebhook(signature, req.rawBody);

    return { received: true };
  }

  @Post('orders/:orderId/checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new Stripe Checkout session for a pending order',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiOkResponse({ type: CheckoutSessionResponseDto })
  @ApiResponse({ status: 400, description: 'Order is not payable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Req() req: Request,
  ): Promise<CheckoutSessionResponseDto> {
    const session =
      await this.paymentsService.createCheckoutSessionForExistingOrder(
        user.id,
        orderId,
        this.resolveFrontendOrigin(req),
      );

    return {
      checkoutUrl: session.checkoutUrl,
    };
  }
}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

type CheckoutLineItem = {
  productId: string;
  title: string;
  quantity: number;
  price: number;
};

type CreateCheckoutSessionInput = {
  orderId: string;
  userId: string;
  userEmail: string;
  items: CheckoutLineItem[];
  frontendOrigin?: string;
};

type CheckoutSessionResult = {
  checkoutUrl: string;
  sessionId: string;
  paymentIntentId: string | null;
  currency: string;
};

function isCheckoutSession(
  object: Stripe.Event.Data.Object,
): object is Stripe.Checkout.Session {
  return 'object' in object && object.object === 'checkout.session';
}

function isPaymentIntent(
  object: Stripe.Event.Data.Object,
): object is Stripe.PaymentIntent {
  return 'object' in object && object.object === 'payment_intent';
}

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly frontendUrl: string;
  private readonly currency: string;
  private readonly stripeSecretKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripeSecretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY')?.trim() ?? '';

    this.stripe = new Stripe(this.stripeSecretKey || 'sk_test_placeholder');
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3002';
    this.currency =
      this.configService.get<string>('STRIPE_CURRENCY')?.toLowerCase() ?? 'usd';
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    this.ensureStripeConfigured();

    const frontendBaseUrl = this.resolveFrontendUrl(input.frontendOrigin);
    const successUrl = new URL('/checkout/success', frontendBaseUrl);
    successUrl.searchParams.set('orderId', input.orderId);
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

    const cancelUrl = new URL('/checkout/cancel', frontendBaseUrl);
    cancelUrl.searchParams.set('orderId', input.orderId);

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: input.userEmail,
        client_reference_id: input.orderId,
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        metadata: {
          orderId: input.orderId,
          userId: input.userId,
        },
        payment_intent_data: {
          metadata: {
            orderId: input.orderId,
            userId: input.userId,
          },
        },
        line_items: input.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: this.currency,
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: item.title,
              metadata: {
                productId: item.productId,
              },
            },
          },
        })),
      });

      if (!session.url) {
        throw new InternalServerErrorException(
          'Stripe Checkout session URL was not returned',
        );
      }

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null,
        currency: this.currency,
      };
    } catch (error: unknown) {
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        throw new ServiceUnavailableException(
          'Stripe is configured with an invalid secret key. Update STRIPE_SECRET_KEY in backend/.env.',
        );
      }

      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  async createCheckoutSessionForExistingOrder(
    userId: string,
    orderId: string,
    frontendOrigin?: string,
  ): Promise<CheckoutSessionResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You can only pay for your own orders');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be paid');
    }

    if (order.payment?.status === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('This order has already been paid');
    }

    const session = await this.createCheckoutSession({
      orderId: order.id,
      userId,
      userEmail: order.user.email,
      frontendOrigin,
      items: order.items.map((item) => ({
        productId: item.productId,
        title: item.product.title,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        amount: order.total,
        currency: session.currency,
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: session.sessionId,
        stripePaymentIntentId: session.paymentIntentId ?? undefined,
      },
      update: {
        currency: session.currency,
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: session.sessionId,
        stripePaymentIntentId: session.paymentIntentId ?? undefined,
      },
    });

    return session;
  }

  async expireCheckoutSession(
    sessionId: string | null | undefined,
  ): Promise<void> {
    if (!sessionId) {
      return;
    }

    if (!this.isStripeConfigured()) {
      return;
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === 'open') {
        await this.stripe.checkout.sessions.expire(sessionId);
      }
    } catch {
      // Ignore Stripe expiration errors. The order state still remains consistent.
    }
  }

  async handleWebhook(
    signature: string | string[] | undefined,
    rawBody: Buffer | undefined,
  ): Promise<void> {
    this.ensureStripeConfigured();

    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';

    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      throw new ServiceUnavailableException(
        'Stripe webhook secret is not configured. Update STRIPE_WEBHOOK_SECRET in backend/.env.',
      );
    }

    if (!rawBody) {
      throw new BadRequestException('Stripe webhook raw body is missing');
    }

    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Stripe signature header is missing');
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const object = event.data.object;
        if (isCheckoutSession(object)) {
          await this.markPaymentSucceeded(object);
        }
        break;
      }
      case 'checkout.session.expired': {
        const object = event.data.object;
        if (isCheckoutSession(object)) {
          await this.markPaymentFailed(
            object.metadata?.orderId,
            object.id,
            typeof object.payment_intent === 'string'
              ? object.payment_intent
              : null,
          );
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const object = event.data.object;
        if (isPaymentIntent(object)) {
          await this.markPaymentFailed(
            object.metadata.orderId,
            null,
            object.id,
          );
        }
        break;
      }
      default:
        break;
    }
  }

  private isStripeConfigured(): boolean {
    return (
      this.stripeSecretKey.length > 0 &&
      this.stripeSecretKey.startsWith('sk_') &&
      !this.stripeSecretKey.includes('placeholder')
    );
  }

  private ensureStripeConfigured(): void {
    if (!this.isStripeConfigured()) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Set a real STRIPE_SECRET_KEY in backend/.env before starting checkout.',
      );
    }
  }

  private resolveFrontendUrl(frontendOrigin?: string): string {
    const candidate = frontendOrigin?.trim();

    if (candidate) {
      try {
        const url = new URL(candidate);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return url.origin;
        }
      } catch {
        // Ignore invalid incoming origin and fall back to configured frontend URL.
      }
    }

    return this.frontendUrl;
  }

  private async markPaymentSucceeded(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const orderId = session.metadata?.orderId ?? session.client_reference_id;

    if (!orderId) {
      throw new BadRequestException('Stripe session does not contain orderId');
    }

    const currency = session.currency?.toLowerCase() ?? this.currency;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { orderId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found for this order');
      }

      if (payment.status !== PaymentStatus.SUCCEEDED) {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: PaymentStatus.SUCCEEDED,
            currency,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId ?? undefined,
          },
        });
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.PAID) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        });
      }
    });
  }

  private async markPaymentFailed(
    orderId: string | null | undefined,
    sessionId: string | null,
    paymentIntentId: string | null,
  ): Promise<void> {
    if (!orderId) {
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment || payment.status === PaymentStatus.SUCCEEDED) {
      return;
    }

    await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.FAILED,
        stripeCheckoutSessionId: sessionId ?? payment.stripeCheckoutSessionId,
        stripePaymentIntentId: paymentIntentId ?? payment.stripePaymentIntentId,
      },
    });
  }
}

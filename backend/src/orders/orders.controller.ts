import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  CreateOrderCheckoutResponseDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-request.type';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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

  @Post()
  @ApiOperation({ summary: 'Create order from current cart' })
  @ApiResponse({
    status: 201,
    description: 'Order created and Stripe Checkout session generated',
    type: CreateOrderCheckoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cart empty / Not enough stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ): Promise<CreateOrderCheckoutResponseDto> {
    return this.ordersService.createOrder(
      user.id,
      dto,
      this.resolveFrontendOrigin(req),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get current user orders (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderQueryDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.ordersService.getOrders(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (owner only)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Order details with items',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the order owner' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.getOrderById(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending order (owner only)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled, stock restored',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Order is not in PENDING status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the order owner' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancelOrder(user.id, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, dto);
  }
}

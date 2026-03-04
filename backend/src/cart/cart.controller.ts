import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-request.type';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart with items and total',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponseDto> {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({
    summary:
      'Add item to cart (upsert — increases quantity if already in cart)',
  })
  @ApiResponse({
    status: 201,
    description: 'Updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Not enough stock / Product not available',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', description: 'Cart item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Not enough stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'id', description: 'Cart item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({
    status: 200,
    description: 'Empty cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearCart(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new order' })
    @ApiResponse({ status: 201, description: 'Order created successfully' })
    create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.userId, createOrderDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all orders for the authenticated user' })
    findAll(@Request() req) {
        return this.ordersService.findAll(req.user.userId, req.user.role);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update order status' })
    updateStatus(@Request() req, @Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user.userId);
    }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
    constructor(private supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async create(buyerId: string, createOrderDto: CreateOrderDto) {
        const { productId, quantity, shippingAddress } = createOrderDto;

        // 1. Fetch product to get price and seller
        const { data: product, error: productError } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            throw new NotFoundException('Product not found');
        }

        if (product.stock < quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        // 2. Calculate Total Price
        const totalAmount = BigInt(product.price) * BigInt(quantity);

        // 3. Create Order
        // Use a short ID (10 chars hex) to be compatible with Starknet felt252
        const onChainId = crypto.randomBytes(5).toString('hex');

        // Insert Order
        const { data: order, error: orderError } = await this.supabase
            .from('orders')
            .insert({
                buyerId,
                sellerId: product.sellerId,
                totalAmount: totalAmount.toString(), // Supabase BigInt might need string or number
                status: 'PENDING',
                onChainId,
            })
            .select() // Return the created order
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            throw new Error('Failed to create order');
        }

        // Insert Order Item
        const { error: itemError } = await this.supabase
            .from('order_items')
            .insert({
                orderId: order.id,
                productId,
                quantity,
                price: product.price // Store historical price
            });

        if (itemError) {
            console.error('Error creating order item:', itemError);
            // Ideally rollback order, but simplified here
        }

        // Return order with details
        return this.findOne(order.id);
    }

    async findAll(userId: string, role: string) {
        // Build query
        let query = this.supabase
            .from('orders')
            .select('*, items:order_items(*, product:products(*)), buyer:users(*), seller:users(*)')
            .order('createdAt', { ascending: false });

        if (role === 'BUYER') {
            query = query.eq('buyerId', userId);
        } else {
            // Assume Seller or Merchant
            query = query.eq('sellerId', userId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*, items:order_items(*, product:products(*)), buyer:users(*), seller:users(*)')
            .eq('id', id)
            .single();

        if (error) throw new NotFoundException(`Order with ID ${id} not found`);
        return data;
    }

    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, userId: string) {
        const { data, error } = await this.supabase
            .from('orders')
            .update({ status: updateOrderStatusDto.status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}

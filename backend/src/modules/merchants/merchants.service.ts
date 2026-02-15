import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UpdateMerchantDto } from './dto/merchant.dto';

@Injectable()
export class MerchantsService {
    constructor(private supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async findAll() {
        const { data, error } = await this.supabase
            .from('users')
            .select('id, walletAddress, createdAt') // Public fields
            .eq('role', 'MERCHANT');

        if (error) throw new Error(error.message);
        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new NotFoundException(`Merchant with ID ${id} not found`);
        return data;
    }

    async update(id: string, updateMerchantDto: UpdateMerchantDto) {
        const { data, error } = await this.supabase
            .from('users')
            .update({
                ...updateMerchantDto,
                role: 'MERCHANT', // Ensure they remain or become a merchant
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getDashboardStats(merchantId: string) {
        // Count sales
        const { count: totalSales, error: salesError } = await this.supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('merchantId', merchantId)
            .eq('status', 'COMPLETED');

        // Count products
        const { count: totalProducts, error: productsError } = await this.supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('sellerId', merchantId)
            .eq('isActive', true);

        // Revenue Aggregation (DB function or client side calc)
        // For simple MVP client side calc of recent payments?
        // Let's just return 0 for now as Supabase client doesn't do sum easily without stored proc.
        // Or we can fetch 'amount' of all completed payments and sum it (inefficient for large data).

        return {
            totalSales: totalSales || 0,
            totalProducts: totalProducts || 0,
            totalRevenue: '0',
            recentOrders: [], // TODO: fetch from orders
        };
    }
}

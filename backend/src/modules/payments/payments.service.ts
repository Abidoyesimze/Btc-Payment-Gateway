import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
    constructor(private supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async create(createPaymentDto: CreatePaymentDto) {
        const { merchantId, amount, customerId, metadata } = createPaymentDto;

        // Verify merchant exists checks are implicit in FK constraints usually, 
        // but explicit check is better for error msgs. Skipping for MVP speed.

        const { data, error } = await this.supabase
            .from('payments')
            .insert({
                amount: amount, // Supabase handles string/number for BigInt
                fee: Math.floor(Number(amount) * 0.01), // 1% fee example
                status: 'PENDING',
                merchantId,
                customerId,
                metadata: metadata || {},
                onChainId: uuidv4(), // Placeholder until we integrate actual blockchain ID
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async findAll() {
        // Need to alias relationships because both merchant and customer point to 'users'
        const { data, error } = await this.supabase
            .from('payments')
            .select('*, merchant:users!merchantId(*), customer:users!customerId(*)')
            .order('createdAt', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('payments')
            .select('*, merchant:users!merchantId(*), customer:users!customerId(*)')
            .eq('id', id)
            .single();

        if (error) throw new NotFoundException(`Payment with ID ${id} not found`);
        return data;
    }

    async findByMerchant(merchantId: string) {
        const { data, error } = await this.supabase
            .from('payments')
            .select('*')
            .eq('merchantId', merchantId)
            .order('createdAt', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }
}

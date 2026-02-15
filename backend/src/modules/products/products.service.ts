import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsService {
    constructor(private supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async create(sellerId: string, createProductDto: CreateProductDto) {
        // In a real flow, this might be linked to an on-chain item creation event
        const { data, error } = await this.supabase
            .from('products')
            .insert({
                ...createProductDto,
                price: createProductDto.price, // Supabase handles BigInt as number/string
                sellerId,
                onChainId: uuidv4(), // Placeholder or from input
            })
            .select('*, seller:users(*)')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async findAll() {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, seller:users(*)')
            .eq('isActive', true)
            .order('createdAt', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, seller:users(*)')
            .eq('id', id)
            .single();

        if (error) throw new NotFoundException(`Product with ID ${id} not found`);
        return data;
    }

    async findBySeller(sellerId: string) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('sellerId', sellerId)
            .order('createdAt', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        const { price, ...rest } = updateProductDto;
        const updates: any = { ...rest };
        if (price) updates.price = price;

        const { data, error } = await this.supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async remove(id: string) {
        const { data, error } = await this.supabase
            .from('products')
            .update({ isActive: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}

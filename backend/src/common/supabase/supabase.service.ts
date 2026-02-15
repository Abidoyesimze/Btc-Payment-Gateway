import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        // Use SERVICE_ROLE_KEY for backend admin access (bypass RLS if needed, or use specific user token)
        // For this backend, assuming we need full access to DB tables.
        // Or strictly use DATABASE_URL if using postgres connection? No, we are using HTTP Client.

        // Ensure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
        // Or reuse existing ANON key if RLS allows it?
        // Backend usually needs Service Role Key to write confidently.

        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || this.configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and Key must be defined in environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
}

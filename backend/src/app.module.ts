import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

// Import modules (will be created)
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { SupabaseModule } from './common/supabase/supabase.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Scheduling for cron jobs
        ScheduleModule.forRoot(),

        // BullMQ for background jobs
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
            },
        }),

        // Feature modules (uncomment as we create them)
        AuthModule,
        PaymentsModule,
        ProductsModule,
        OrdersModule,
        MerchantsModule,
        // AnalyticsModule,
        // AnalyticsModule,
        BlockchainModule,
        SupabaseModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

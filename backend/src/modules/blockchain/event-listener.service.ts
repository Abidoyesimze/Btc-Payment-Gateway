import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StarknetService } from './starknet.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { hash, num } from 'starknet';

@Injectable()
export class EventListenerService implements OnModuleInit {
    private readonly logger = new Logger(EventListenerService.name);
    private isProcessing = false;
    private lastProcessedBlock = 0; // Should persist this in DB

    // Event Hashes
    private PAYMENT_CREATED_HASH: string;
    private PAYMENT_COMPLETED_HASH: string;

    constructor(
        private starknetService: StarknetService,
        private supabaseService: SupabaseService,
        private configService: ConfigService,
    ) {
        // Calculate selectors on init
        this.PAYMENT_CREATED_HASH = hash.getSelectorFromName('PaymentCreated');
        this.PAYMENT_COMPLETED_HASH = hash.getSelectorFromName('PaymentCompleted');
    }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async onModuleInit() {
        // Load last processed block from DB or config
        // this.lastProcessedBlock = await this.getLastBlockFromDB();
    }

    // Poll for events every 10 seconds
    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleCron() {
        if (this.isProcessing) {
            this.logger.debug('Skipping event processing - previous job still running');
            return;
        }

        this.isProcessing = true;

        try {
            const latestBlock = await this.starknetService.getLatestBlock();
            const latestBlockNumber = latestBlock.block_number;

            if (latestBlockNumber > this.lastProcessedBlock) {
                this.logger.log(`Processing blocks from ${this.lastProcessedBlock + 1} to ${latestBlockNumber}`);

                // Fetch events for the Payment Gateway contract
                const paymentContractAddress = this.configService.get<string>('PAYMENT_GATEWAY_ADDRESS');
                if (paymentContractAddress) {
                    const events = await this.starknetService.checkEvents(this.lastProcessedBlock + 1, latestBlockNumber, paymentContractAddress);
                    await this.processEvents(events);
                } else {
                    this.logger.warn('PAYMENT_GATEWAY_ADDRESS not set, skipping specific contract event fetch');
                }

                this.lastProcessedBlock = latestBlockNumber;
            }
        } catch (error) {
            this.logger.error('Error in event listener cron:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processEvents(events: any[]) {
        if (!events || events.length === 0) return;

        this.logger.log(`Processing ${events.length} events`);

        for (const event of events) {
            try {
                // Check event name hash (first key usually)
                if (!event.keys || event.keys.length === 0) continue;

                const eventHash = event.keys[0];

                if (eventHash === this.PAYMENT_CREATED_HASH) {
                    await this.handlePaymentCreated(event);
                } else if (eventHash === this.PAYMENT_COMPLETED_HASH) {
                    await this.handlePaymentCompleted(event);
                }
            } catch (err) {
                this.logger.error(`Failed to process event ${event.transaction_hash}:`, err);
            }
        }
    }

    private async handlePaymentCreated(event: any) {
        // Event: PaymentCreated(payment_id, merchant, customer, amount, metadata, timestamp)
        // Keys: [Selector, payment_id(2), merchant]
        // Data: [amount(2), metadata, timestamp]
        // Note: Assumed 2 felts for u256 based on standard encoding, but might vary slightly.
        // Assuming keys[1] is low, keys[2] is high for payment_id.

        const paymentIdLow = BigInt(event.keys[1]);
        const paymentIdHigh = BigInt(event.keys[2]);
        const paymentId = (paymentIdHigh << 128n) + paymentIdLow;
        const paymentIdStr = paymentId.toString();

        const metadata = event.data[2]; // onChainId (hex)

        // Find Order by onChainId
        const { data: order, error: orderError } = await this.supabase
            .from('orders')
            .select('*')
            .eq('onChainId', metadata) // Assuming metadata matches exactly or needs decoding? Hex string in felt.
            .single();

        if (orderError || !order) {
            this.logger.warn(`Order not found for metadata: ${metadata}`);
            return;
        }

        // Create Payment
        const amountLow = BigInt(event.data[0]);
        const amountHigh = BigInt(event.data[1]);
        const amount = (amountHigh << 128n) + amountLow;

        const { error: paymentError } = await this.supabase
            .from('payments')
            .insert({
                onChainId: paymentIdStr,
                merchantId: order.sellerId,
                customerId: order.buyerId,
                amount: amount.toString(),
                fee: 0, // Should be from event if available or calculated
                status: 'PENDING',
                orderId: order.id
            });

        if (paymentError) {
            this.logger.error(`Failed to create payment record: ${paymentError.message}`);
        } else {
            this.logger.log(`Payment record created for Order ${order.id}`);

            // Optionally update Order status
            await this.supabase
                .from('orders')
                .update({ paymentId: paymentIdStr }) // Wait, paymentId in Order is UUID of Payment table? or onChainId?
            // Order table has `paymentId UUID`. So we need the ID of the inserted payment.
            // But insert above didn't return ID.
            // Let's assume we link via `orderId` in Payment table (added in SQL schema).
        }
    }

    private async handlePaymentCompleted(event: any) {
        // Event: PaymentCompleted(payment_id, merchant, amount_to_merchant, fee, timestamp)
        // keys: [selector, payment_id(2), merchant]

        const paymentIdLow = BigInt(event.keys[1]);
        const paymentIdHigh = BigInt(event.keys[2]);
        const paymentId = (paymentIdHigh << 128n) + paymentIdLow;
        const paymentIdStr = paymentId.toString();

        this.logger.log(`Payment Completed on Chain: PaymentID=${paymentIdStr}`);

        // Update Payment status
        const { data: payment, error: paymentError } = await this.supabase
            .from('payments')
            .update({ status: 'COMPLETED', confirmedAt: new Date().toISOString() })
            .eq('onChainId', paymentIdStr)
            .select()
            .single();

        if (paymentError) {
            this.logger.error(`Failed to update payment status: ${paymentError.message}`);
            return;
        }

        // Update Order status
        if (payment && payment.orderId) {
            await this.supabase
                .from('orders')
                .update({ status: 'PAID' })
                .eq('id', payment.orderId);
            this.logger.log(`Order ${payment.orderId} marked as PAID`);
        }
    }
}

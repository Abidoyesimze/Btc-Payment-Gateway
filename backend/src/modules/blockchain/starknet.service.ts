import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcProvider, Contract, num, hash, shortString } from 'starknet';
import { PAYMENT_GATEWAY_ABI } from './abis/payment-gateway.abi';

@Injectable()
export class StarknetService implements OnModuleInit {
    private readonly logger = new Logger(StarknetService.name);
    private provider: RpcProvider;

    // Contract instances
    private paymentGatewayContract: Contract;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const nodeUrl = this.configService.get<string>('STARKNET_RPC_URL');

        this.provider = new RpcProvider({ nodeUrl });
        this.logger.log(`Connected to Starknet RPC: ${nodeUrl}`);

        // Initialize contracts if addresses are present
        this.initializeContracts();
    }

    private initializeContracts() {
        const paymentGatewayAddress = this.configService.get<string>('PAYMENT_GATEWAY_ADDRESS');

        if (paymentGatewayAddress) {
            this.paymentGatewayContract = new Contract({ abi: PAYMENT_GATEWAY_ABI, address: paymentGatewayAddress, providerOrAccount: this.provider });
            this.logger.log(`Initialized Payment Gateway at ${paymentGatewayAddress}`);
        } else {
            this.logger.warn('PAYMENT_GATEWAY_ADDRESS not set in .env');
        }
    }

    // Public method to expose the contract instance if needed (e.g. for parsing events)
    getContract() {
        return this.paymentGatewayContract;
    }

    async getLatestBlock() {
        return this.provider.getBlock('latest');
    }

    async getTransactionReceipt(txHash: string) {
        return this.provider.getTransactionReceipt(txHash);
    }

    async verifyTransaction(txHash: string) {
        try {
            const receipt: any = await this.provider.getTransactionReceipt(txHash);
            // Check execution status for V3 transactions
            if (receipt.execution_status === 'SUCCEEDED' || receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error verifying transaction ${txHash}:`, error);
            return false;
        }
    }

    // Read function: Get Payment Details directly from Contract
    async getPaymentDetails(paymentId: string) {
        if (!this.paymentGatewayContract) {
            throw new Error('Payment Gateway Contract not initialized');
        }
        try {
            // payment_id is u256, usually passed as {low, high} or just a BigInt/String if library handles it
            // starknet.js v6 often handles BigInt automatically
            const result = await this.paymentGatewayContract.get_payment(paymentId);
            return result;
        } catch (error) {
            this.logger.error(`Error fetching payment details for ${paymentId}:`, error);
            throw error;
        }
    }

    async checkEvents(fromBlock: number, toBlock: number, address?: string) {
        try {
            const keys = []; // Filter by specific event hashes if needed
            // For example: [hash.getSelectorFromName('PaymentSuccessful')]

            const eventsParam = {
                from_block: { block_number: fromBlock },
                to_block: { block_number: toBlock },
                address: address ? address : undefined, // Check specific contract or all if undefined
                keys,
                chunk_size: 10 // Simplified chunk size
            };

            const response = await this.provider.getEvents(eventsParam);
            return response.events;
        } catch (error) {
            this.logger.error(`Error fetching events from ${fromBlock} to ${toBlock}:`, error);
            return [];
        }
    }
}

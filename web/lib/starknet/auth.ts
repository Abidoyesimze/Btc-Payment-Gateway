/**
 * Merchant Authentication via PaymentGateway Contract
 * Handles merchant registration and verification
 */

import type { AccountInterface } from 'starknet';
import { Contract, RpcProvider } from 'starknet';
import { STARKNET_CONFIG } from '../config';

// ABI for PaymentGateway merchant functions
const PAYMENT_GATEWAY_ABI = [
    {
        name: 'register_merchant',
        type: 'function',
        inputs: [{ name: 'name', type: 'felt252' }],
        outputs: [],
        stateMutability: 'external',
    },
    {
        name: 'is_registered_merchant',
        type: 'function',
        inputs: [{ name: 'merchant', type: 'ContractAddress' }],
        outputs: [{ name: 'is_registered', type: 'bool' }],
        stateMutability: 'view',
    },
    {
        name: 'get_merchant_name',
        type: 'function',
        inputs: [{ name: 'merchant', type: 'ContractAddress' }],
        outputs: [{ name: 'name', type: 'felt252' }],
        stateMutability: 'view',
    },
] as const;

/**
 * Get the PaymentGateway contract instance
 */
export function getPaymentGatewayContract(account?: AccountInterface): Contract {
    const provider = new RpcProvider({
        nodeUrl: STARKNET_CONFIG.rpcUrls[STARKNET_CONFIG.network],
    });

    const contract = new Contract({
        abi: PAYMENT_GATEWAY_ABI,
        address: STARKNET_CONFIG.contractAddresses.paymentGateway,
        providerOrAccount: account || provider,
    });

    return contract;
}

/**
 * Check if an address is a registered merchant
 */
export async function verifyMerchantRole(address: string): Promise<boolean> {
    try {
        if (!STARKNET_CONFIG.contractAddresses.paymentGateway) {
            console.warn('PaymentGateway contract address not configured');
            return false;
        }

        const contract = getPaymentGatewayContract();
        const result = await contract.call('is_registered_merchant', [address]);
        return Boolean(result);
    } catch (error) {
        console.error('Error verifying merchant role:', error);
        return false;
    }
}

/**
 * Get merchant name
 */
export async function getMerchantName(address: string): Promise<string | null> {
    try {
        if (!STARKNET_CONFIG.contractAddresses.paymentGateway) {
            console.warn('PaymentGateway contract address not configured');
            return null;
        }

        const contract = getPaymentGatewayContract();
        const result = await contract.call('get_merchant_name', [address]);

        // Convert felt252 to string if needed
        return result ? String(result) : null;
    } catch (error) {
        console.error('Error getting merchant name:', error);
        return null;
    }
}

/**
 * Register the connected account as a merchant
 * @param account - The Starknet account to register
 * @param merchantName - The name to register (will be converted to felt252)
 */
export async function registerMerchant(
    account: AccountInterface,
    merchantName: string
): Promise<void> {
    try {
        if (!STARKNET_CONFIG.contractAddresses.paymentGateway) {
            throw new Error('PaymentGateway contract address not configured');
        }

        // Convert merchant name to felt252 (short string)
        // For now, we'll use the string directly - Starknet.js will handle conversion
        const contract = getPaymentGatewayContract(account);
        const tx = await contract.invoke('register_merchant', [merchantName]);

        if ('transaction_hash' in tx) {
            await account.waitForTransaction(tx.transaction_hash);
        }
    } catch (error) {
        console.error('Error registering merchant:', error);
        throw error;
    }
}

/**
 * Check if an address is a registered seller
 * TODO: Implement when seller role contract functions are available
 */
export async function verifySellerRole(address: string): Promise<boolean> {
    try {
        // Placeholder - implement when contract has seller role verification
        console.warn('verifySellerRole not yet implemented');
        return false;
    } catch (error) {
        console.error('Error verifying seller role:', error);
        return false;
    }
}

/**
 * Check if an address is a registered buyer
 * TODO: Implement when buyer role contract functions are available
 */
export async function verifyBuyerRole(address: string): Promise<boolean> {
    try {
        // Placeholder - implement when contract has buyer role verification
        console.warn('verifyBuyerRole not yet implemented');
        return false;
    } catch (error) {
        console.error('Error verifying buyer role:', error);
        return false;
    }
}

/**
 * Starknet Wallet Integration
 * Handles wallet connection and disconnection
 */

import { connect, disconnect } from '@starknet-io/get-starknet';
import type { StarknetWindowObject } from '@starknet-io/get-starknet';

export interface WalletConnection {
    wallet: StarknetWindowObject;
    address: string;
    chainId: string;
}

/**
 * Connect to a Starknet wallet (Argent X, Braavos, etc.)
 */
export async function connectWallet(): Promise<WalletConnection> {
    try {
        const starknet = await connect({
            modalMode: 'alwaysAsk',
            modalTheme: 'dark',
        });

        if (!starknet) {
            throw new Error('Failed to connect wallet');
        }

        // Request account access
        const accounts = await starknet.request({
            type: 'wallet_requestAccounts',
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
        }

        // Get chain ID
        const chainId = await starknet.request({
            type: 'wallet_requestChainId',
        });


        return {
            wallet: starknet,
            address: accounts[0],
            chainId: chainId || 'SN_SEPOLIA',
        };
    } catch (error) {
        console.error('Wallet connection error:', error);
        throw error;
    }
}

/**
 * Disconnect from the current wallet
 */
export async function disconnectWallet(): Promise<void> {
    try {
        await disconnect();
    } catch (error) {
        console.error('Wallet disconnection error:', error);
    }
}

/**
 * Get the currently connected wallet
 */
export function getConnectedWallet(): WalletConnection | null {
    // This will be managed by the auth store
    return null;
}

/**
 * Sign a message with the connected wallet
 */
export async function signMessage(
    wallet: StarknetWindowObject,
    message: string
): Promise<string[]> {
    try {
        const typedData = {
            domain: {
                name: 'BTC Payment Gateway',
                version: '1',
                chainId: 'SN_SEPOLIA',
            },
            types: {
                Message: [{ name: 'message', type: 'felt' }],
            },
            primaryType: 'Message',
            message: {
                message,
            },
        };

        const signature = await wallet.request({
            type: 'wallet_signTypedData',
            params: typedData,
        });
        return signature;
    } catch (error) {
        console.error('Message signing error:', error);
        throw error;
    }
}

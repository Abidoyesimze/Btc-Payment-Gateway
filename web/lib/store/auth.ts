/**
 * Authentication Store
 * Manages wallet connection and user authentication state
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StarknetWindowObject } from '@starknet-io/get-starknet';
import {
    connectWallet,
    disconnectWallet,
    verifyMerchantRole,
    verifySellerRole,
    verifyBuyerRole,
} from '../starknet';
import type { UserRole } from '../types';

interface AuthState {
    // State
    walletAddress: string | null;
    wallet: StarknetWindowObject | null;
    role: UserRole | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    connect: () => Promise<void>;
    disconnect: () => void;
    checkRole: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            walletAddress: null,
            wallet: null,
            role: null,
            isConnected: false,
            isLoading: false,
            error: null,

            // Connect wallet and verify role
            connect: async () => {
                set({ isLoading: true, error: null });

                try {
                    const connection = await connectWallet();
                    const address = connection.address;

                    // Check role from smart contract
                    const [isMerchant, isSeller, isBuyer] = await Promise.all([
                        verifyMerchantRole(address),
                        verifySellerRole(address),
                        verifyBuyerRole(address),
                    ]);

                    // Determine role (priority: merchant > seller > buyer)
                    let role: UserRole = 'buyer';
                    if (isMerchant) role = 'merchant';
                    else if (isSeller) role = 'seller';

                    set({
                        walletAddress: address,
                        wallet: connection.wallet,
                        role,
                        isConnected: true,
                        isLoading: false,
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isConnected: false,
                    });
                    throw error;
                }
            },

            // Disconnect wallet
            disconnect: () => {
                disconnectWallet();
                set({
                    walletAddress: null,
                    wallet: null,
                    role: null,
                    isConnected: false,
                    error: null,
                });
            },

            // Re-check role from smart contract
            checkRole: async () => {
                const { walletAddress } = get();
                if (!walletAddress) return;

                try {
                    const [isMerchant, isSeller, isBuyer] = await Promise.all([
                        verifyMerchantRole(walletAddress),
                        verifySellerRole(walletAddress),
                        verifyBuyerRole(walletAddress),
                    ]);

                    let role: UserRole = 'buyer';
                    if (isMerchant) role = 'merchant';
                    else if (isSeller) role = 'seller';

                    set({ role });
                } catch (error) {
                    console.error('Error checking role:', error);
                }
            },

            // Clear error message
            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            // Only persist wallet address and role, not the account object
            partialize: (state) => ({
                walletAddress: state.walletAddress,
                role: state.role,
                isConnected: state.isConnected,
            }),
        }
    )
);

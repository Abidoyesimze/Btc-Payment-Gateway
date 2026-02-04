/**
 * Starknet Configuration
 * Network settings and contract addresses
 */

export const STARKNET_CONFIG = {
    network: (process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia') as 'mainnet' | 'sepolia',
    chainId: process.env.NEXT_PUBLIC_STARKNET_CHAIN_ID || 'SN_SEPOLIA',

    contractAddresses: {
        paymentGateway: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_CONTRACT_ADDRESS || '',
        wbtcToken: process.env.NEXT_PUBLIC_WBTC_TOKEN_ADDRESS || '',
        marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '',
    },

    // RPC endpoints
    rpcUrls: {
        mainnet: 'https://starknet-mainnet.public.blastapi.io',
        sepolia: 'https://starknet-sepolia.public.blastapi.io',
    },
} as const;

export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    timeout: 10000,
} as const;

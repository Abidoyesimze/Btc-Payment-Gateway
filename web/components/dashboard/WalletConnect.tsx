/**
 * Wallet Connect Component
 * Handles Starknet wallet connection for authentication
 */

'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui';

export function WalletConnect() {
    const { isConnected, walletAddress, role, isLoading, error, connect, disconnect, clearError } = useAuthStore();
    const [showError, setShowError] = useState(false);

    const handleConnect = async () => {
        try {
            setShowError(false);
            await connect();
        } catch (err) {
            setShowError(true);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setShowError(false);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isConnected && walletAddress) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700">
                        {formatAddress(walletAddress)}
                    </span>
                    {role && (
                        <span className="text-xs text-gray-500 capitalize">
                            {role}
                        </span>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <Button
                variant="primary"
                onClick={handleConnect}
                isLoading={isLoading}
            >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>

            {showError && error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 max-w-sm">
                    <div className="flex items-start gap-2">
                        <svg
                            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm text-red-800">{error}</p>
                            <button
                                onClick={() => {
                                    clearError();
                                    setShowError(false);
                                }}
                                className="text-xs text-red-600 hover:text-red-800 mt-1"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

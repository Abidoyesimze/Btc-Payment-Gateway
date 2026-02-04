/**
 * Wallet Guard Component
 * Protects routes that require wallet connection and specific roles
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import type { UserRole } from '@/lib/types';

export interface WalletGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    redirectTo?: string;
}

export function WalletGuard({
    children,
    requiredRole,
    redirectTo = '/',
}: WalletGuardProps) {
    const router = useRouter();
    const { isConnected, role, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading) {
            // Not connected - redirect
            if (!isConnected) {
                router.push(redirectTo);
                return;
            }

            // Connected but wrong role - redirect
            if (requiredRole && role !== requiredRole) {
                router.push(redirectTo);
                return;
            }
        }
    }, [isConnected, role, isLoading, requiredRole, redirectTo, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Not connected or wrong role
    if (!isConnected || (requiredRole && role !== requiredRole)) {
        return null;
    }

    // Authorized - render children
    return <>{children}</>;
}

/**
 * Core Type Definitions
 * Shared types used across the application
 */

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment {
    id: string;
    merchantId: string;
    amount: number; // in satoshis
    currency: 'BTC';
    status: PaymentStatus;
    btcAddress: string;
    expiresAt: Date;
    confirmedAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    CONFIRMED = 'confirmed',
    EXPIRED = 'expired',
    FAILED = 'failed',
}

export interface CreatePaymentRequest {
    amount: number;
    metadata?: Record<string, any>;
    expiresIn?: number; // seconds
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
    id: string;
    sellerId: string;
    name: string;
    description: string;
    price: number; // in satoshis
    images: string[];
    category: string;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProductRequest {
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    stock: number;
}

// ============================================================================
// Order Types
// ============================================================================

export interface Order {
    id: string;
    buyerId: string;
    sellerId: string;
    items: OrderItem[];
    totalAmount: number;
    paymentId: string;
    status: OrderStatus;
    shippingAddress?: Address;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    productId: string;
    product: Product;
    quantity: number;
    price: number; // price at time of purchase
}

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
    walletAddress: string;
    role: UserRole;
    createdAt: Date;
}

export type UserRole = 'merchant' | 'buyer' | 'seller';

// ============================================================================
// Starknet Types
// ============================================================================

export interface StarknetAccount {
    address: string;
    chainId: string;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface CartItem {
    product: Product;
    quantity: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface PaymentFilters {
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}

export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    pageSize?: number;
}

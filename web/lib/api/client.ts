/**
 * API Client
 * Axios-based client for backend API communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../config';
import type {
    Payment,
    CreatePaymentRequest,
    PaymentFilters,
    Product,
    CreateProductRequest,
    ProductFilters,
    Order,
    ApiResponse,
    PaginatedResponse,
} from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor (add auth token if needed)
apiClient.interceptors.request.use(
    (config) => {
        // Add wallet address or signature to headers if needed
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
            config.headers['X-Wallet-Address'] = walletAddress;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response) {
            // Server responded with error
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// ============================================================================
// Payment API
// ============================================================================

export const paymentsApi = {
    /**
     * Create a new payment request
     */
    create: async (data: CreatePaymentRequest): Promise<Payment> => {
        const response = await apiClient.post<ApiResponse<Payment>>('/payments', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create payment');
        }
        return response.data.data;
    },

    /**
     * Get payment by ID
     */
    get: async (id: string): Promise<Payment> => {
        const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch payment');
        }
        return response.data.data;
    },

    /**
     * List payments with filters
     */
    list: async (filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> => {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Payment>>>(
            '/payments',
            { params: filters }
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch payments');
        }
        return response.data.data;
    },
};

// ============================================================================
// Product API
// ============================================================================

export const productsApi = {
    /**
     * List products with filters
     */
    list: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
            '/products',
            { params: filters }
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch products');
        }
        return response.data.data;
    },

    /**
     * Get product by ID
     */
    get: async (id: string): Promise<Product> => {
        const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch product');
        }
        return response.data.data;
    },

    /**
     * Create a new product (seller only)
     */
    create: async (data: CreateProductRequest): Promise<Product> => {
        const response = await apiClient.post<ApiResponse<Product>>('/products', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create product');
        }
        return response.data.data;
    },

    /**
     * Update a product (seller only)
     */
    update: async (id: string, data: Partial<CreateProductRequest>): Promise<Product> => {
        const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update product');
        }
        return response.data.data;
    },

    /**
     * Delete a product (seller only)
     */
    delete: async (id: string): Promise<void> => {
        const response = await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete product');
        }
    },
};

// ============================================================================
// Order API
// ============================================================================

export const ordersApi = {
    /**
     * Create a new order
     */
    create: async (items: { productId: string; quantity: number }[]): Promise<Order> => {
        const response = await apiClient.post<ApiResponse<Order>>('/orders', { items });
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create order');
        }
        return response.data.data;
    },

    /**
     * Get order by ID
     */
    get: async (id: string): Promise<Order> => {
        const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch order');
        }
        return response.data.data;
    },

    /**
     * List user's orders
     */
    list: async (): Promise<Order[]> => {
        const response = await apiClient.get<ApiResponse<Order[]>>('/orders');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch orders');
        }
        return response.data.data;
    },
};

// ============================================================================
// Merchant API
// ============================================================================

export const merchantsApi = {
    /**
     * Get merchant profile
     */
    getProfile: async () => {
        const response = await apiClient.get<ApiResponse<any>>('/merchant/profile');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch profile');
        }
        return response.data.data;
    },

    /**
     * Update merchant settings
     */
    updateSettings: async (data: any) => {
        const response = await apiClient.put<ApiResponse<any>>('/merchant/settings', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update settings');
        }
        return response.data.data;
    },
};

export default apiClient;

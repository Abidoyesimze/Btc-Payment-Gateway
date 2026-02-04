/**
 * Shopping Cart Store
 * Manages cart items for the marketplace
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

interface CartState {
    // State
    items: CartItem[];

    // Computed
    totalItems: number;
    totalAmount: number;

    // Actions
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            // Initial state
            items: [],
            totalItems: 0,
            totalAmount: 0,

            // Add item to cart
            addItem: (product, quantity = 1) => {
                const { items } = get();
                const existingItem = items.find((item) => item.product.id === product.id);

                let newItems: CartItem[];

                if (existingItem) {
                    // Update quantity if item already exists
                    newItems = items.map((item) =>
                        item.product.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                } else {
                    // Add new item
                    newItems = [...items, { product, quantity }];
                }

                const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
                const totalAmount = newItems.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                );

                set({ items: newItems, totalItems, totalAmount });
            },

            // Remove item from cart
            removeItem: (productId) => {
                const { items } = get();
                const newItems = items.filter((item) => item.product.id !== productId);

                const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
                const totalAmount = newItems.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                );

                set({ items: newItems, totalItems, totalAmount });
            },

            // Update item quantity
            updateQuantity: (productId, quantity) => {
                const { items } = get();

                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                const newItems = items.map((item) =>
                    item.product.id === productId ? { ...item, quantity } : item
                );

                const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
                const totalAmount = newItems.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                );

                set({ items: newItems, totalItems, totalAmount });
            },

            // Clear all items
            clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0 }),
        }),
        {
            name: 'cart-storage',
        }
    )
);

'use client';

import { create } from 'zustand';

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  attributes: { length?: string; texture?: string };
  product: Product;
  images: ProductImage[];
}

export interface CartItem {
  id: string;
  productVariantId: string;
  quantity: number;
  variant: ProductVariant;
}

export interface CartState {
  id: string | null;
  items: CartItem[];
  sessionId: string | null;
  isDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  initializeSession: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  mergeCart: () => Promise<void>;
  toggleDrawer: (isOpen: boolean) => void;
  clearCart: () => void;
}

const generateUUID = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
};

export const useCartStore = create<CartState>((set, get) => ({
  id: null,
  items: [],
  sessionId: null,
  isDrawerOpen: false,
  isLoading: false,
  error: null,

  initializeSession: () => {
    if (typeof window === 'undefined') return;
    
    let sid = localStorage.getItem('hairotic_session_id');
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem('hairotic_session_id', sid);
    }
    set({ sessionId: sid });
  },

  fetchCart: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`http://localhost:3001/api/v1/cart?sessionId=${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to retrieve cart');
      const data = await res.json();
      set({ id: data.id, items: data.items });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (variantId: string, quantity: number) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`http://localhost:3001/api/v1/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity, sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add item to cart');
      }
      const data = await res.json();
      set({ id: data.id, items: data.items, isDrawerOpen: true });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`http://localhost:3001/api/v1/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update quantity');
      }
      const data = await res.json();
      set({ id: data.id, items: data.items });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`http://localhost:3001/api/v1/cart/items/${itemId}?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to remove item');
      const data = await res.json();
      set({ id: data.id, items: data.items });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  mergeCart: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`http://localhost:3001/api/v1/cart/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ id: data.id, items: data.items });
      }
    } catch (err: any) {
      console.error('Failed to merge cart', err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleDrawer: (isOpen: boolean) => set({ isDrawerOpen: isOpen }),
  
  clearCart: () => set({ items: [], id: null }),
}));

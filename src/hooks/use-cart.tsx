'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useUser } from '@/firebase/auth/use-user';
import { generateAndCacheProductContent } from '@/lib/ai-content-generator';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartKey = user ? `elevendocs_cart_${user.uid}` : null;

  // Load cart on user change
  useEffect(() => {
    if (cartKey) {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      } else {
        setCartItems([]);
      }
    } else {
      // User is logged out, clear cart state
      setCartItems([]);
    }
  }, [cartKey]);

  // Save cart on item changes
  useEffect(() => {
    if (cartKey) {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } else {
        // If user is logged out, we can remove the old generic cart key to be safe
        localStorage.removeItem('elevendocs_cart');
    }
  }, [cartItems, cartKey]);

  const addToCart = (product: Product) => {
    // Trigger background PDF generation for products that should have content.
    // This is a "fire-and-forget" call.
    if (product.hasStaticContent) {
      generateAndCacheProductContent(product);
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // In this store, each item is unique, so we just ensure it's in the cart.
        // If we wanted quantity, we would increment it here.
        return prevItems; 
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

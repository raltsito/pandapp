'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CartItem, cartTotal, clearCart, getCart, setCart } from '@/lib/cart';

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (idProducto: number) => void;
  updateQuantity: (idProducto: number, cantidad: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  function sync(next: CartItem[]) {
    setCart(next);
    setItems(next);
  }

  const addToCart = useCallback((item: CartItem) => {
    const cart = getCart();
    const idx = cart.findIndex(i => i.idProducto === item.idProducto);
    if (idx >= 0) {
      cart[idx].cantidad += item.cantidad;
    } else {
      cart.push(item);
    }
    sync(cart);
  }, []);

  const removeFromCart = useCallback((idProducto: number) => {
    sync(getCart().filter(i => i.idProducto !== idProducto));
  }, []);

  const updateQuantity = useCallback((idProducto: number, cantidad: number) => {
    if (cantidad <= 0) {
      sync(getCart().filter(i => i.idProducto !== idProducto));
      return;
    }
    sync(getCart().map(i => i.idProducto === idProducto ? { ...i, cantidad } : i));
  }, []);

  const doClearCart = useCallback(() => {
    clearCart();
    setItems([]);
  }, []);

  return (
    <CartContext.Provider value={{
      items,
      count: items.reduce((s, i) => s + i.cantidad, 0),
      total: cartTotal(items),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart: doClearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

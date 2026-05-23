const CART_KEY = 'panda_cart';

export interface CartItem {
  idProducto: number;
  nombre: string;
  precioBase: number;
  cantidad: number;
  fotoUrl: string | null;
  personalizacion?: {
    saborPan: string;
    relleno: string;
    decoracionEspecial?: string;
    mensajeDedicatoria?: string;
    cargoExtra: number;
  };
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const precio = item.precioBase + (item.personalizacion?.cargoExtra ?? 0);
    return sum + precio * item.cantidad;
  }, 0);
}

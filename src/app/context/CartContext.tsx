'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from './StoreContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { priceForRole, type CartItem, type CartLine } from '@/lib/types';

const STORAGE_KEY = 'tienda:cart';

interface CartState {
  items: CartItem[];
  count: number;
  total: number;
  qtyOf: (productId: string) => number;
  add: (productId: string) => void;
  dec: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}

const isLine = (v: unknown): v is CartLine =>
  typeof v === 'object' && v !== null &&
  typeof (v as CartLine).id === 'string' && typeof (v as CartLine).qty === 'number';

function readStoredCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, loading } = useStore();
  const { profile } = useAuth();
  const toast = useToast();
  // Se lee del navegador al montar. No causa error de hidratación porque
  // lo que se muestra depende de `products`, que empieza vacío.
  const [lines, setLines] = useState<CartLine[]>(readStoredCart);

  // Guarda el carrito (descartando productos que ya no existen)
  useEffect(() => {
    try {
      const keep = loading || products.length === 0 ? lines : lines.filter((l) => products.some((p) => p.id === l.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [lines, products, loading]);

  const items = useMemo<CartItem[]>(() => {
    const out: CartItem[] = [];
    for (const l of lines) {
      const product = products.find((p) => p.id === l.id);
      if (!product || !product.visible) continue;
      const qty = Math.min(l.qty, product.stock ?? Infinity);
      if (qty > 0) out.push({ product: { ...product, price: priceForRole(product, profile?.role) }, qty });
    }
    return out;
  }, [lines, products, profile?.role]);

  const count = useMemo(() => items.reduce((a, i) => a + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((a, i) => a + i.product.price * i.qty, 0), [items]);

  const qtyOf = useCallback((id: string) => items.find((i) => i.product.id === id)?.qty ?? 0, [items]);

  const add = useCallback(
    (id: string) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      const current = lines.find((l) => l.id === id)?.qty ?? 0;
      if (product.stock !== null && current + 1 > product.stock) {
        toast(`Stock máximo disponible: ${product.stock}`);
        return;
      }
      setLines((prev) =>
        prev.some((l) => l.id === id)
          ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l))
          : [...prev, { id, qty: 1 }]
      );
    },
    [products, lines, toast]
  );

  const dec = useCallback((id: string) => {
    setLines((prev) =>
      prev.flatMap((l) => (l.id !== id ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []))
    );
  }, []);

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(
    () => ({ items, count, total, qtyOf, add, dec, remove, clear }),
    [items, count, total, qtyOf, add, dec, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import ProductCard from './ProductCard';

export default function ProductGrid({ query = '' }: { query?: string }) {
  const { products, settings, loading } = useStore();
  const { isAdmin } = useAuth();
  const cart = useCart();

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      products.filter(
        (p) => p.visible && (!q || `${p.name} ${p.description}`.toLowerCase().includes(q))
      ),
    [products, q]
  );

  if (loading) return <p className="muted">Cargando productos…</p>;

  if (!list.length) {
    const message = q
      ? 'No encontramos productos con esa búsqueda.'
      : isAdmin
        ? 'Aún no hay productos visibles. Agrégalos desde el Panel.'
        : 'Pronto tendremos productos disponibles.';
    return <div className="empty">{message}</div>;
  }

  return (
    <div className="grid">
      {list.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          currency={settings.currency}
          qty={cart.qtyOf(p.id)}
          onAdd={() => cart.add(p.id)}
          onDec={() => cart.dec(p.id)}
          onRemove={() => cart.remove(p.id)}
        />
      ))}
    </div>
  );
}
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import type { Category } from '@/lib/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  query?: string;
  categoryId?: string;
  categories?: Category[];
  includeChildren?: boolean;
  /** Producto que no debe listarse (por ejemplo, el que ya se muestra arriba). */
  excludeId?: string;
}

export default function ProductGrid({ query = '', categoryId = '', categories = [], includeChildren = true, excludeId }: ProductGridProps) {
  const { products, settings, loading } = useStore();
  const { isAdmin, profile } = useAuth();
  const cart = useCart();

  const q = query.trim().toLowerCase();
  const categoryIds = useMemo(() => {
    if (!categoryId) return null;
    const childIds = includeChildren ? categories.filter((category) => category.parentId === categoryId).map((category) => category.id) : [];
    return new Set([categoryId, ...childIds]);
  }, [categories, categoryId, includeChildren]);
  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          p.visible &&
          p.id !== excludeId &&
          (!categoryIds || categoryIds.has(p.categoryId ?? '')) &&
          (!q || `${p.name} ${p.description}`.toLowerCase().includes(q))
      ),
    [products, q, categoryIds, excludeId]
  );

  if (loading) return <p className="muted">Cargando productos…</p>;

  if (!list.length) {
    const message = q || categoryId
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
          role={profile?.role}
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

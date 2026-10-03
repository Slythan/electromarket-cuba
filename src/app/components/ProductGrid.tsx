'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import type { Category, Product } from '@/lib/types';
import { fetchVisibleProductsPage } from '@/services/products';
import ProductCard from './ProductCard';
import Button from './ui/Button';

interface ProductGridProps {
  query?: string;
  categoryId?: string;
  categories?: Category[];
  initialProducts?: Product[];
  initialHasMore?: boolean;
  includeChildren?: boolean;
  hideEmpty?: boolean;
  /** Producto que no debe listarse (por ejemplo, el que ya se muestra arriba). */
  excludeId?: string;
}

export default function ProductGrid({ query = '', categoryId = '', categories = [], initialProducts, initialHasMore = false, includeChildren = true, excludeId, hideEmpty = false }: ProductGridProps) {
  const { settings } = useStore();
  const { isAdmin, profile } = useAuth();
  const cart = useCart();
  const search = query.trim();
  const categoryIds = useMemo(() => {
    if (!categoryId) return [];
    const childIds = includeChildren ? categories.filter((category) => category.parentId === categoryId).map((category) => category.id) : [];
    return [categoryId, ...childIds].sort();
  }, [categories, categoryId, includeChildren]);
  const dataKey = JSON.stringify([categoryIds, search, excludeId ?? '']);
  const [products, setProducts] = useState<Product[]>(() => initialProducts && !search ? initialProducts : []);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [productsLoading, setProductsLoading] = useState(initialProducts === undefined || Boolean(search));
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const pageRef = useRef(0);
  const currentKeyRef = useRef(dataKey);
  const firstEffectRef = useRef(true);

  useEffect(() => {
    const isInitialPage = firstEffectRef.current && initialProducts !== undefined && !search &&
      (initialProducts.length > 0 || initialHasMore);
    firstEffectRef.current = false;
    if (isInitialPage) return;

    let active = true;
    currentKeyRef.current = dataKey;
    pageRef.current = 0;
    setProducts([]);
    setHasMore(false);
    setProductsLoading(true);
    setLoadError(false);
    fetchVisibleProductsPage({ categoryIds, query: search, page: 0, pageSize: 12 })
      .then((result) => {
        if (!active) return;
        setProducts(result.products);
        setHasMore(result.hasMore);
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setProductsLoading(false));

    return () => { active = false; };
  }, [dataKey, categoryIds, search, initialProducts, initialHasMore, retryToken]);

  useEffect(() => {
    const refresh = () => setRetryToken((token) => token + 1);
    window.addEventListener('catalog:refresh', refresh);
    return () => window.removeEventListener('catalog:refresh', refresh);
  }, []);

  const list = useMemo(() => products.filter((product) => product.id !== excludeId), [products, excludeId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    setLoadError(false);
    try {
      const result = await fetchVisibleProductsPage({ categoryIds, query: search, page: nextPage, pageSize: 12 });
      if (currentKeyRef.current !== dataKey) return;
      pageRef.current = nextPage;
      setProducts((current) => [...current, ...result.products]);
      setHasMore(result.hasMore);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  if (productsLoading) return <p className="muted">Cargando productos…</p>;

  if (loadError && !list.length) {
    return <div className="empty">No se pudieron cargar los productos. <Button size="sm" variant="ghost" onClick={() => setRetryToken((token) => token + 1)}>Reintentar</Button></div>;
  }

  if (!list.length) {
    if (hideEmpty) return null;
    const message = search || categoryId
      ? 'No encontramos productos con esa búsqueda.'
      : isAdmin
        ? 'Aún no hay productos visibles. Agrégalos desde el Panel.'
        : 'Pronto tendremos productos disponibles.';
    return <div className="empty">{message}</div>;
  }

  return (
    <>
      <div className="grid">
        {list.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            role={profile?.role}
            currency={settings.currency}
            qty={cart.qtyOf(product.id)}
            onAdd={() => cart.add(product)}
            onDec={() => cart.dec(product.id)}
            onRemove={() => cart.remove(product.id)}
          />
        ))}
      </div>
      {loadError && <div className="empty">No se pudo cargar la siguiente página. <Button size="sm" variant="ghost" onClick={() => void loadMore()}>Reintentar</Button></div>}
      {hasMore && !loadError && <div className="catalog-load-more"><Button variant="ghost" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Cargando…' : 'Cargar más productos'}</Button></div>}
    </>
  );
}

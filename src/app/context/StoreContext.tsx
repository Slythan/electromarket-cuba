'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { fetchProducts, fetchProductsByCategoryIds } from '@/services/products';
import { fetchBanners } from '@/services/banners';
import { fetchCategories } from '@/services/categories';
import { DEFAULT_SETTINGS, fetchSettings } from '@/services/settings';
import type { Banner, Category, Product, Settings } from '@/lib/types';

interface StoreState {
  settings: Settings;
  products: Product[];
  banners: Banner[];
  categories: Category[];
  loading: boolean;
  reloadProducts: () => Promise<void>;
  reloadSettings: () => Promise<void>;
  reloadBanners: () => Promise<void>;
  reloadCategories: () => Promise<void>;
}

const StoreContext = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryRouteId = pathname.startsWith('/categorias/') ? pathname.split('/')[2] : '';

  const reloadProducts = useCallback(async () => {
    try {
      setProducts(await fetchProducts());
    } catch {
      /* se mantiene la lista anterior */
    }
  }, []);

  const reloadSettings = useCallback(async () => {
    setSettings(await fetchSettings());
  }, []);

  const reloadBanners = useCallback(async () => {
    try {
      setBanners(await fetchBanners());
    } catch {
      setBanners([]);
    }
  }, []);

  const reloadCategories = useCallback(async () => {
    try {
      setCategories(await fetchCategories());
    } catch {
      setCategories([]);
    }
  }, []);

  // Se recarga al iniciar y cada vez que cambia la sesión
  // (el administrador también ve los productos ocultos).
  const userId = user?.id;
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const isHomeRoute = pathname === '/';
    Promise.all([fetchSettings(), isHomeRoute ? fetchBanners().catch(() => null) : Promise.resolve(null), fetchCategories().catch(() => null)])
      .then(async ([s, b, c]) => {
        if (!active) return;
        const categoryIds = categoryRouteId
          ? [categoryRouteId, ...(c ?? []).filter((category) => category.parentId === categoryRouteId).map((category) => category.id)]
          : null;
        const p = await (categoryIds ? fetchProductsByCategoryIds(categoryIds) : fetchProducts()).catch(() => null);
        if (!active) return;
        setSettings(s);
        if (p) setProducts(p);
        if (b) setBanners(b);
        if (c) setCategories(c);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authLoading, categoryRouteId, pathname, userId]);

  useEffect(() => {
    document.title = settings.storeName;
  }, [settings.storeName]);

  const value = useMemo<StoreState>(
    () => ({ settings, products, banners, categories, loading, reloadProducts, reloadSettings, reloadBanners, reloadCategories }),
    [settings, products, banners, categories, loading, reloadProducts, reloadSettings, reloadBanners, reloadCategories]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
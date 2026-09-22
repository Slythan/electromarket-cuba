'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { fetchProducts } from '@/services/products';
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
  const isHome = pathname === '/';
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Siempre se carga el catálogo completo: el carrito necesita resolver cualquier
    // producto y cada vista filtra por categoría en pantalla.
    Promise.all([fetchSettings(), fetchCategories().catch(() => null), fetchProducts().catch(() => null)])
      .then(([nextSettings, nextCategories, nextProducts]) => {
        if (!active) return;
        setSettings(nextSettings);
        if (nextCategories) setCategories(nextCategories);
        if (nextProducts) setProducts(nextProducts);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authLoading, userId]);

  // Los banners solo se muestran en la portada.
  useEffect(() => {
    if (authLoading || !isHome) return;
    let active = true;
    fetchBanners()
      .then((items) => active && setBanners(items))
      .catch(() => active && setBanners([]));
    return () => {
      active = false;
    };
  }, [authLoading, isHome, userId]);

  useEffect(() => {
    document.title = settings.storeName;
  }, [settings.storeName]);

  const value = useMemo<StoreState>(
    () => ({ settings, products, banners, categories, loading, reloadProducts, reloadSettings, reloadBanners, reloadCategories }),
    [settings, products, banners, categories, loading, reloadProducts, reloadSettings, reloadBanners, reloadCategories]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
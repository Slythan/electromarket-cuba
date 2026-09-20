'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/admin/hooks/useOrders';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductTab';
import SettingsTab from './SettingsTab';
import BannersTab from './BannersTab';
import CategoriesTab from '@/components/admin/CategoriesTab';

type Tab = 'products' | 'orders' | 'banners' | 'categories' | 'config';

const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Productos' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'banners', label: 'Banners' },  
  { id: 'categories', label: 'Categorías' },
  { id: 'config', label: 'Configuración' },
];

export default function AdminPanel() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const { products } = useStore();
  const [tab, setTab] = useState<Tab>('products');
  const { orders, setOrders, loading: ordersLoading, reload } = useOrders(isAdmin);

  if (authLoading) {
    return <div className="container"><p className="muted admin">Cargando…</p></div>;
  }

  // Esta comprobación solo controla lo que se ve; la seguridad real está en las reglas (RLS) de Supabase.
  if (!isAdmin) {
    return (
      <div className="container admin">
        <h1>Panel de administración</h1>
        <p className="muted">
          {user
            ? 'Tu cuenta no tiene permisos de administrador.'
            : 'Inicia sesión con la cuenta administradora para entrar.'}
        </p>
        <Link href="/" className="btn btn--primary">Volver a la tienda</Link>
      </div>
    );
  }

  const visible = products.filter((p) => p.visible).length;
  const newOrders = orders.filter((o) => o.status === 'nuevo').length;

  return (
    <div className="container admin">
      <header className="admin__header">
        <div>
          <span className="eyebrow">ELECTROMARKET · CONTROL</span>
          <h1>Panel de administración</h1>
          <p className="muted">Gestiona el catálogo, las promociones y los pedidos desde un solo lugar.</p>
        </div>
        <Link href="/" className="btn btn--ghost btn--sm">Ver tienda</Link>
      </header>

      <div className="stats">
        <div className="stat"><b>{products.length}</b><span className="muted">Productos</span></div>
        <div className="stat"><b>{visible}</b><span className="muted">Visibles</span></div>
        <div className="stat"><b>{newOrders}</b><span className="muted">Pedidos nuevos</span></div>
      </div>

      <div className="pill-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsTab />}
      {tab === 'orders' && <OrdersTab orders={orders} setOrders={setOrders} loading={ordersLoading} onReload={reload} />}
      {tab === 'banners' && <BannersTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'config' && <SettingsTab />}
    </div>
  );
}
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
import DeliveryZonesTab from './DeliveryZonesTab';
import ManagersTab from './ManagersTab';
import UsersTab from './UsersTab';
import GuidesTab from './GuidesTab';

type Tab = 'products' | 'orders' | 'banners' | 'categories' | 'delivery' | 'managers' | 'users' | 'guides' | 'config';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'products', label: 'Productos', icon: '📦' },
  { id: 'orders', label: 'Pedidos', icon: '🧾' },
  { id: 'managers', label: 'Gestores', icon: '🤝' },
  { id: 'banners', label: 'Banners', icon: '🖼️' },
  { id: 'categories', label: 'Categorías', icon: '🗂️' },
  { id: 'delivery', label: 'Mensajería', icon: '🚚' },
  { id: 'users', label: 'Usuarios y solicitudes', icon: '👥' },
  { id: 'guides', label: 'Guías', icon: '📝' },
  { id: 'config', label: 'Configuración', icon: '⚙️' },
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
  const newOrders = orders.filter((o) => o.status === 'creada').length;
  const salesTotal = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <nav className="admin-nav" aria-label="Secciones del panel">
        <div className="container admin-nav__inner" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`admin-nav__link${tab === t.id ? ' is-active' : ''}`}
              onClick={(e) => {
                setTab(t.id);
                // Desliza la barra para dejar visible la pestaña seleccionada.
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
            >
              <span aria-hidden="true" className="admin-nav__icon">{t.icon}</span>
              {t.label}
              {t.id === 'orders' && newOrders > 0 && <span className="admin-nav__badge">{newOrders}</span>}
            </button>
          ))}
        </div>
      </nav>

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
          <div className="stat"><b>{salesTotal.toLocaleString('es-CU', { minimumFractionDigits: 2 })}</b><span className="muted">Ventas registradas</span></div>
        </div>

        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab orders={orders} setOrders={setOrders} loading={ordersLoading} onReload={reload} />}
        {tab === 'managers' && <ManagersTab />}
        {tab === 'banners' && <BannersTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'delivery' && <DeliveryZonesTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'guides' && <GuidesTab />}
        {tab === 'config' && <SettingsTab />}
      </div>
    </>
  );
}
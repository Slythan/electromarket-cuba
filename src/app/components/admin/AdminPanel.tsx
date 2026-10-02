'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/admin/hooks/useOrders';
import { formatMoney } from '@/lib/format';
import type { Order, Product } from '@/lib/types';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductTab';
import SettingsTab from './SettingsTab';
import BannersTab from './BannersTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import DeliveryZonesTab from './DeliveryZonesTab';
import ManagersTab from './ManagersTab';
import UsersTab from './UsersTab';
import GuidesTab from './GuidesTab';

type Tab = 'dashboard' | 'products' | 'orders' | 'banners' | 'categories' | 'delivery' | 'managers' | 'users' | 'guides' | 'config';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Resumen', icon: '▦' },
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

const ORDER_LABELS: Record<Order['status'], string> = {
  creada: 'Creada',
  confirmada: 'Confirmada',
  enviada: 'Enviada',
  cobrada: 'Cobrada',
};

const ORDER_STAGES: Order['status'][] = ['creada', 'confirmada', 'enviada', 'cobrada'];

function DashboardOverview({ orders, products, ordersLoading, productsLoading, currency, onOpen }: {
  orders: Order[];
  products: Product[];
  ordersLoading: boolean;
  productsLoading: boolean;
  currency: string;
  onOpen: (tab: Tab) => void;
}) {
  const recentOrders = orders.slice(0, 5);
  const visibleProducts = products.filter((product) => product.visible);
  const outOfStockCount = visibleProducts.filter((product) => product.stock !== null && product.stock <= 0).length;
  const lowStockCount = visibleProducts.filter((product) => product.stock !== null && product.stock > 0 && product.stock <= 3).length;
  const statusCounts = ORDER_STAGES.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  const pendingCount = statusCounts.filter(({ status }) => status === 'creada' || status === 'confirmada').reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="admin-dashboard" aria-labelledby="admin-dashboard-title">
      <div className="admin-dashboard__heading">
        <div><span className="eyebrow">VISTA GENERAL</span><h2 id="admin-dashboard-title">Actividad de la tienda</h2></div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onOpen('orders')}>Abrir pedidos <span aria-hidden="true">→</span></button>
      </div>
      <div className="admin-dashboard__body">
        <section className="admin-dashboard__activity" aria-labelledby="admin-recent-orders">
          <div className="admin-dashboard__section-heading"><h3 id="admin-recent-orders">Pedidos recientes</h3><span className="muted">Hasta 5</span></div>
          {ordersLoading ? <p className="admin-dashboard__empty muted">Cargando pedidos…</p> : recentOrders.length ? recentOrders.map((order) => {
            const initials = order.customerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
            return (
              <div className="admin-dashboard__row" key={order.id}>
                <span className="admin-dashboard__avatar" aria-hidden="true">{initials || 'CL'}</span>
                <div className="admin-dashboard__customer"><strong>{order.customerName}</strong><time className="muted" dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString('es-CU', { day: 'numeric', month: 'short' })}</time></div>
                <span className={`admin-status admin-status--${order.status}`}>{ORDER_LABELS[order.status]}</span>
                <strong className="admin-dashboard__total">{formatMoney(order.total, currency)}</strong>
              </div>
            );
          }) : <p className="admin-dashboard__empty muted">Aún no hay pedidos para mostrar.</p>}
        </section>
        <div className="admin-dashboard__side">
          <section className="admin-dashboard__status" aria-labelledby="admin-order-status">
            <div className="admin-dashboard__section-heading"><h3 id="admin-order-status">Estado de pedidos</h3><span className="muted">{ordersLoading ? '…' : orders.length}</span></div>
            {statusCounts.map(({ status, count }) => (
              <div className="admin-dashboard__status-row" key={status}>
                <span>{ORDER_LABELS[status]}</span>
                <span className="admin-dashboard__track" aria-hidden="true"><span className={`admin-dashboard__fill admin-dashboard__fill--${status}`} style={{ width: `${orders.length ? (count / orders.length) * 100 : 0}%` }} /></span>
                <strong>{ordersLoading ? '–' : count}</strong>
              </div>
            ))}
            <p className="admin-dashboard__pending">{ordersLoading ? 'Actualizando pedidos…' : `${pendingCount} pedidos por atender`}</p>
          </section>
          <nav className="admin-dashboard__shortcuts" aria-label="Accesos rápidos">
            <h3>Accesos rápidos</h3>
            <button type="button" className="admin-dashboard__action" onClick={() => onOpen('products')}>Productos <span aria-hidden="true">→</span></button>
            <button type="button" className="admin-dashboard__action" onClick={() => onOpen('categories')}>Categorías <span aria-hidden="true">→</span></button>
            <button type="button" className="admin-dashboard__action" onClick={() => onOpen('users')}>Usuarios <span aria-hidden="true">→</span></button>
          </nav>
        </div>
      </div>
      <div className={`admin-dashboard__inventory${outOfStockCount || lowStockCount ? ' is-warning' : ''}`}>
        <div><strong>Inventario</strong><span>{productsLoading ? 'Actualizando catálogo…' : outOfStockCount || lowStockCount ? `${outOfStockCount} agotados · ${lowStockCount} con 1–3 unidades` : 'Sin alertas de stock bajo'}</span></div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onOpen('products')}>Revisar productos <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

export default function AdminPanel() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const { products, settings, loading: productsLoading } = useStore();
  const [tab, setTab] = useState<Tab>('dashboard');
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
  const pendingOrders = orders.filter((order) => order.status === 'creada' || order.status === 'confirmada').length;
  const ordersTotal = orders.reduce((sum, order) => sum + order.total, 0);
  const salesScope = orders.length >= 100 ? 'Suma de los 100 pedidos más recientes' : `Suma de ${orders.length} pedidos`;

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
            <span className="eyebrow">ElectroMarketCuba · Control</span>
            <h1>Panel de administración</h1>
            <p className="muted">Gestiona el catálogo, las promociones y los pedidos desde un solo lugar.</p>
          </div>
          <Link href="/" className="btn btn--ghost btn--sm">Ver tienda</Link>
        </header>

        {tab === 'dashboard' && <>
          <div className="admin-kpis" aria-label="Indicadores principales">
            <article className="admin-kpi admin-kpi--blue"><span>Productos en catálogo</span><strong>{productsLoading ? '…' : products.length}</strong><small>{productsLoading ? 'Cargando catálogo' : `${visible} disponibles en la tienda`}</small></article>
            <article className="admin-kpi admin-kpi--amber"><span>Pedidos por atender</span><strong>{ordersLoading ? '…' : pendingOrders}</strong><small>{ordersLoading ? 'Cargando pedidos' : 'Nuevos o confirmados'}</small></article>
            <article className="admin-kpi admin-kpi--green"><span>Importe de pedidos</span><strong>{ordersLoading ? '…' : formatMoney(ordersTotal, settings.currency)}</strong><small>{ordersLoading ? 'Calculando' : salesScope}</small></article>
          </div>
          <DashboardOverview orders={orders} products={products} ordersLoading={ordersLoading} productsLoading={productsLoading} currency={settings.currency} onOpen={setTab} />
        </>}
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
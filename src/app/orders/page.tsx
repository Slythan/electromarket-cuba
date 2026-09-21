'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/admin/hooks/useOrders';
import { formatMoney } from '@/lib/format';

export default function OrdersPage() {
  const { user, profile, loading } = useAuth();
  const { settings } = useStore();
  const { orders, loading: ordersLoading } = useOrders(Boolean(user), user?.id);

  if (loading) return <div className="container account"><p className="muted">Cargando órdenes…</p></div>;
  if (!user) return <div className="container account"><h1>Órdenes</h1><p>Inicia sesión para consultar tus órdenes.</p><Link href="/" className="btn">Volver a la tienda</Link></div>;

  return (
    <div className="container account">
      <header className="admin__header">
        <div><span className="eyebrow">ELECTROMARKET · HISTORIAL</span><h1>Mis órdenes</h1><p className="muted">Consulta el estado y el detalle de tus compras.</p></div>
        <Link href="/account" className="btn btn--ghost btn--sm">Gestionar cuenta</Link>
      </header>
      {ordersLoading ? <p className="muted">Cargando órdenes…</p> : orders.length === 0 ? <div className="note">Todavía no tienes órdenes. <Link href="/">Explorar la tienda</Link></div> : <div className="rows orders-page__list">{orders.map((order) => <article className="order" key={order.id}><div className="order__head"><div><strong>{new Date(order.createdAt).toLocaleString('es')}</strong><span className="muted order__customer">{profile?.name || user.email}</span></div><span className="status-pill">{order.status}</span></div>{order.items.map((item, index) => <div className="sumline" key={`${item.id}-${index}`}><span>{item.qty} × {item.name}</span><span>{formatMoney(item.price * item.qty, settings.currency)}</span></div>)}<div className="sumline sumline--total"><b>Total</b><b>{formatMoney(order.total, settings.currency)}</b></div></article>)}</div>}
    </div>
  );
}
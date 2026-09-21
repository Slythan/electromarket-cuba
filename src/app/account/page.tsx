'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useOrders } from '@/admin/hooks/useOrders';
import { createManagerRequest } from '@/services/managerRequests';
import { formatMoney, translateError } from '@/lib/format';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';

export default function AccountPage() {
  const { user, profile, loading, changePassword } = useAuth();
  const { settings } = useStore();
  const toast = useToast();
  const { orders, loading: ordersLoading } = useOrders(Boolean(user), user?.id);
  const [passwordError, setPasswordError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);

  if (loading) return <div className="container account"><p className="muted">Cargando cuenta…</p></div>;
  if (!user) return <div className="container account"><h1>Mi cuenta</h1><p>Inicia sesión para consultar tus órdenes.</p><Link href="/" className="btn">Volver a la tienda</Link></div>;

  const onPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (password.length < 6 || password !== confirmation) return setPasswordError('Usa al menos 6 caracteres y repite la misma contraseña.');
    setBusy(true);
    setPasswordError('');
    const error = await changePassword(password);
    setBusy(false);
    if (error) return setPasswordError(error);
    event.currentTarget.reset();
    toast('Contraseña actualizada');
  };

  const onRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setRequestError('');
    try {
      await createManagerRequest({ userId: user.id, name: String(form.get('name') ?? ''), phone: String(form.get('phone') ?? ''), message: String(form.get('message') ?? '') });
      setRequested(true);
      toast('Solicitud enviada');
    } catch (error) {
      setRequestError(translateError(error instanceof Error ? error.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container account">
      <header className="admin__header"><div><span className="eyebrow">ELECTROMARKET · CUENTA</span><h1>Hola, {profile?.name || user.email}</h1><p className="muted">Gestiona tus pedidos y los datos de acceso.</p></div><Link href="/" className="btn btn--ghost btn--sm">Ver tienda</Link></header>
      <div className="account-grid">
        <section><h2>Mis órdenes</h2>{ordersLoading ? <p className="muted">Cargando órdenes…</p> : orders.length === 0 ? <div className="note">Todavía no tienes órdenes.</div> : <div className="rows">{orders.map((order) => <article className="order" key={order.id}><div className="order__head"><strong>{new Date(order.createdAt).toLocaleString('es')}</strong><span className="tag">{order.status}</span></div>{order.items.map((item, index) => <div className="sumline" key={`${item.id}-${index}`}><span>{item.qty} × {item.name}</span><span>{formatMoney(item.price * item.qty, settings.currency)}</span></div>)}<div className="sumline sumline--total"><b>Total</b><b>{formatMoney(order.total, settings.currency)}</b></div></article>)}</div>}</section>
        <aside className="account-side">
          <section className="settings-panel"><h2>Contraseña</h2><form className="form" onSubmit={onPassword}><Field label="Nueva contraseña"><input className="input" type="password" name="password" minLength={6} required /></Field><Field label="Repetir contraseña"><input className="input" type="password" name="confirmation" minLength={6} required /></Field><p className="form__error">{passwordError}</p><Button type="submit" disabled={busy}>Actualizar contraseña</Button></form></section>
          {profile?.role === 'customer' && <section className="settings-panel"><h2>Solicitar cuenta de gestor</h2>{requested ? <p className="muted">Tu solicitud fue enviada. El administrador revisará tus datos.</p> : <form className="form" onSubmit={onRequest}><Field label="Nombre"><input className="input" name="name" defaultValue={profile?.name} required /></Field><Field label="Teléfono"><input className="input" name="phone" defaultValue={profile?.phone} required /></Field><Field label="Mensaje"><textarea className="input" name="message" rows={3} placeholder="Cuéntanos sobre tu negocio" required /></Field><p className="form__error">{requestError}</p><Button type="submit" disabled={busy}>Enviar solicitud</Button></form>}</section>}
        </aside>
      </div>
    </div>
  );
}
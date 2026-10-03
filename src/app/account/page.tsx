'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useOrders } from '@/admin/hooks/useOrders'; // TODO: mover a '@/hooks/useOrders'
import {
  createManagerRequest,
  getMyManagerRequest,
  type ManagerRequestStatus,
} from '@/services/managerRequests';
import { formatMoney, translateError } from '@/lib/format';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';

// Debe coincidir con el mínimo configurado en Supabase (Auth > Providers > Email).
// La validación real la hace el servidor; esta solo evita una petición inútil.
const MIN_PASSWORD_LENGTH = 8;

type Order = ReturnType<typeof useOrders>['orders'][number];
type Currency = Parameters<typeof formatMoney>[1];

// El cliente no debe ver estados internos de liquidación (p. ej. "cobrada").
const STATUS_LABELS: Record<string, string> = {
  creada: 'Recibido',
  confirmada: 'Confirmado',
  enviada: 'Enviado',
  cobrada: 'Completado',
  cancelada: 'Cancelado',
  // Estados antiguos, por si la migración aún no se ha ejecutado
  nuevo: 'Recibido',
  confirmado: 'Confirmado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function formatDate(value: string | number | Date) {
  return new Date(value).toLocaleString('es-CU', {
    timeZone: 'America/Havana',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function OrderCard({ order, currency }: { order: Order; currency: Currency }) {
  return (
    <article className="order">
      <div className="order__head">
        <strong>{formatDate(order.createdAt)}</strong>
        <span className="tag">{STATUS_LABELS[order.status] ?? order.status}</span>
      </div>
      {order.items.map((item, index) => (
        <div className="sumline" key={`${item.id}-${index}`}>
          <span>
            {item.qty} × {item.name}
          </span>
          <span>{formatMoney(item.price * item.qty, currency)}</span>
        </div>
      ))}
      {order.deliveryZone && (
        <div className="sumline">
          <span>Mensajería · {order.deliveryZone}</span>
          <span>{order.deliveryFee ? formatMoney(order.deliveryFee, currency) : 'Gratis'}</span>
        </div>
      )}
      <div className="sumline sumline--total">
        <b>Total</b>
        <b>{formatMoney(order.total, currency)}</b>
      </div>
    </article>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guardar el formulario ANTES de cualquier await: después, currentTarget es null.
    const formEl = event.currentTarget;
    const data = new FormData(formEl);
    const password = String(data.get('password') ?? '');
    const confirmation = String(data.get('confirmation') ?? '');

    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    if (password !== confirmation) {
      return setError('Las contraseñas no coinciden.');
    }

    setBusy(true);
    setError('');
    try {
      const failure = await changePassword(password);
      if (failure) {
        setError(failure);
        return;
      }
      formEl.reset();
      toast('Contraseña actualizada');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-panel">
      <h2>Contraseña</h2>
      <form className="form" onSubmit={onSubmit}>
        <Field label="Nueva contraseña">
          <input
            className="input"
            type="password"
            name="password"
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Repetir contraseña">
          <input
            className="input"
            type="password"
            name="confirmation"
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            required
          />
        </Field>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          Actualizar contraseña
        </Button>
      </form>
    </section>
  );
}

function ManagerRequestSection({
  userId,
  defaultName,
  defaultPhone,
}: {
  userId: string;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<ManagerRequestStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Consulta si ya existe una solicitud, para que sobreviva a recargas de la página.
  useEffect(() => {
    let active = true;
    getMyManagerRequest(userId)
      .then((request) => {
        if (active) setStatus(request?.status ?? null);
      })
      .catch(() => {
        // Si la comprobación falla se muestra el formulario;
        // el índice único en la base de datos evita duplicados pendientes.
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!name || !phone || !message) {
      return setError('Completa todos los campos.');
    }

    setBusy(true);
    setError('');
    try {
      await createManagerRequest({ userId, name, phone, message });
      setStatus('pending');
      toast('Solicitud enviada');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (checking) {
    content = <p className="muted">Comprobando tu solicitud…</p>;
  } else if (status === 'pending') {
    content = (
      <p className="muted">
        Tu solicitud está en revisión. El administrador se pondrá en contacto contigo.
      </p>
    );
  } else if (status === 'approved') {
    content = (
      <p className="muted">
        Tu solicitud fue aprobada. Recarga la página para ver tus nuevos permisos.
      </p>
    );
  } else {
    content = (
      <>
        {status === 'rejected' && (
          <p className="muted">
            Tu solicitud anterior no fue aprobada. Puedes enviar una nueva.
          </p>
        )}
        <form className="form" onSubmit={onSubmit}>
          <Field label="Nombre">
            <input
              className="input"
              name="name"
              defaultValue={defaultName}
              maxLength={100}
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Teléfono">
            <input
              className="input"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaultPhone}
              minLength={8}
              maxLength={20}
              autoComplete="tel"
              required
            />
          </Field>
          <Field label="Mensaje">
            <textarea
              className="input"
              name="message"
              rows={3}
              maxLength={500}
              placeholder="Cuéntanos sobre tu negocio"
              required
            />
          </Field>
          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            Enviar solicitud
          </Button>
        </form>
      </>
    );
  }

  return (
    <section className="settings-panel">
      <h2>Solicitar cuenta de gestor</h2>
      {content}
    </section>
  );
}

export default function AccountPage() {
  const { user, profile, loading, isGuest } = useAuth();
  const { settings } = useStore();

  // El cast permite leer `error` si el hook lo devuelve (ver nota en la respuesta);
  // si aún no lo devuelve, queda undefined y no rompe nada.
  const ordersQuery = useOrders(Boolean(user), user?.id) as ReturnType<typeof useOrders> & {
    error?: unknown;
  };
  const { orders, loading: ordersLoading, error: ordersError } = ordersQuery;

  if (loading) {
    return (
      <div className="container account">
        <p className="muted">Cargando cuenta…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container account">
        <h1>Mi cuenta</h1>
        <p>Inicia sesión para consultar tus órdenes.</p>
        <Link href="/" className="btn">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="container account">
        <h1>Estás comprando como invitado</h1>
        <p className="muted">No se creó una cuenta. Tus pedidos están asociados a la sesión guardada en este navegador.</p>
        <Link href="/orders" className="btn">Consultar mis pedidos</Link>
      </div>
    );
  }

  return (
    <div className="container account">
      <header className="admin__header">
        <div>
          <span className="eyebrow">ElectroMarketCuba · Cuenta</span>
          <h1>Hola, {profile?.name || user.email}</h1>
          <p className="muted">Gestiona tus pedidos y los datos de acceso.</p>
        </div>
        <Link href="/" className="btn btn--ghost btn--sm">
          Ver tienda
        </Link>
      </header>

      <div className="account-grid">
        <section aria-labelledby="orders-title">
          <h2 id="orders-title">Mis órdenes</h2>
          {ordersLoading ? (
            <p className="muted">Cargando órdenes…</p>
          ) : ordersError ? (
            <div className="note" role="alert">
              No pudimos cargar tus órdenes. Recarga la página para intentarlo de nuevo.
            </div>
          ) : orders.length === 0 ? (
            <div className="note">Todavía no tienes órdenes.</div>
          ) : (
            <div className="rows">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} currency={settings.currency} />
              ))}
            </div>
          )}
        </section>

        <aside className="account-side">
          <PasswordForm />
          {profile?.role === 'customer' && (
            <ManagerRequestSection
              userId={user.id}
              defaultName={profile?.name}
              defaultPhone={profile?.phone}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

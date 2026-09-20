'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useUI } from '@/context/UIContext';
import { useCheckout } from '@/admin/hooks/useCheckout';
import { formatMoney } from '@/lib/format';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';

export default function CheckoutModal() {
  const { close } = useUI();
  const { profile } = useAuth();
  const { items, total } = useCart();
  const { settings } = useStore();
  const { submit, whatsappReady } = useCheckout();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const money = (n: number) => formatMoney(n, settings.currency);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const customer = {
      name: String(f.get('name') ?? '').trim(),
      phone: String(f.get('phone') ?? '').trim(),
      address: String(f.get('address') ?? '').trim(),
      notes: String(f.get('notes') ?? '').trim(),
    };
    setBusy(true);
    setError('');
    const err = await submit(customer); // window.open ocurre dentro, antes de cualquier await
    if (err) {
      setBusy(false);
      setError(err);
    }
  };

  return (
    <Modal title="Finalizar compra" onClose={close}>
      <div className="note">
        {items.map(({ product, qty }) => (
          <div className="sumline" key={product.id}>
            <span>{qty} × {product.name}</span>
            <span>{money(product.price * qty)}</span>
          </div>
        ))}
        <div className="sumline sumline--total">
          <b>Total</b>
          <b>{money(total)}</b>
        </div>
      </div>

      {!whatsappReady && (
        <p className="warn">La tienda todavía no configuró su número de WhatsApp. Avísale al administrador.</p>
      )}

      {/* key: si el perfil llega después, el formulario se rellena con sus datos */}
      <form className="form" onSubmit={onSubmit} key={profile?.id ?? 'anon'}>
        <Field label="Nombre">
          <input className="input" type="text" name="name" maxLength={60} defaultValue={profile?.name ?? ''} required />
        </Field>
        <Field label="Teléfono de contacto">
          <input className="input" type="tel" name="phone" defaultValue={profile?.phone ?? ''} required />
        </Field>
        <Field label="Dirección de entrega">
          <textarea
            className="input"
            name="address"
            maxLength={240}
            rows={3}
            placeholder="Calle, número, entre calles, municipio, provincia"
            required
          />
        </Field>
        <Field label="Notas (opcional)">
          <input className="input" type="text" name="notes" maxLength={160} placeholder="Horario, referencias…" />
        </Field>
        <p className="form__error">{error}</p>
        <Button type="submit" block disabled={busy || !whatsappReady}>
          {busy ? 'Enviando…' : '💬 Enviar pedido por WhatsApp'}
        </Button>
      </form>
    </Modal>
  );
}
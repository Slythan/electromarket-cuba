'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useUI } from '@/context/UIContext';
import { useCheckout } from '@/admin/hooks/useCheckout';
import { formatMoney } from '@/lib/format';
import { FREE_DELIVERY_UNDER, deliveryFeeFor, findZone, isFreeDelivery } from '@/lib/delivery';
import { hasManagerPricing } from '@/lib/types';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';

export default function CheckoutModal() {
  const { close } = useUI();
  const { profile } = useAuth();
  const { items, total } = useCart();
  const { settings, deliveryZones } = useStore();
  const { submit, whatsappReady } = useCheckout();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [negotiatedInput, setNegotiatedInput] = useState('');
  const [zoneInput, setZoneInput] = useState('');

  const money = (n: number) => formatMoney(n, settings.currency);
  const isManager = hasManagerPricing(profile?.role);
  const negotiatedPreview = Number(negotiatedInput.replace(',', '.')) || 0;
  const zone = findZone(deliveryZones, zoneInput);
  const zonePrice = zone?.price ?? 0;
  const freeDelivery = isFreeDelivery(negotiatedPreview || total);
  const deliveryPreview = isManager ? deliveryFeeFor(negotiatedPreview, zonePrice) : 0;
  const commissionBasePreview = Math.max(0, total - negotiatedPreview);
  const commissionPreview = commissionBasePreview - deliveryPreview;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const customer = {
      name: String(f.get('name') ?? '').trim(),
      phone: String(f.get('phone') ?? '').trim(),
      address: String(f.get('address') ?? '').trim(),
      notes: String(f.get('notes') ?? '').trim(),
      negotiatedTotal: Number(String(f.get('negotiatedTotal') ?? '').replace(',', '.')),
      // El precio de mensajería lo pone el municipio elegido, no se escribe a mano.
      deliveryZone: String(f.get('deliveryZone') ?? ''),
      deliveryFee: deliveryPreview,
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
        <Field label={isManager ? 'Nombre del cliente' : 'Nombre'}>
          <input className="input" type="text" name="name" maxLength={60} defaultValue={isManager ? '' : profile?.name ?? ''} placeholder={isManager ? 'Nombre de la persona que recibe' : 'Nombre completo'} required />
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
        {isManager && <>
          <div className="two-col">
            <Field label={`Precio negociado (${settings.currency})`}>
              <input className="input" type="text" name="negotiatedTotal" inputMode="decimal" placeholder={money(total)} value={negotiatedInput} onChange={(event) => setNegotiatedInput(event.target.value)} required />
              <small className="field__hint">Precio final acordado con el cliente.</small>
            </Field>
            <Field label="Municipio de entrega" hint="Su precio de mensajería se descuenta de la comisión.">
              <select className="input" name="deliveryZone" value={zoneInput} onChange={(event) => setZoneInput(event.target.value)} required>
                <option value="">Elegir municipio…</option>
                {deliveryZones.map((item) => (
                  <option key={item.id} value={item.municipality}>{item.municipality} · {money(item.price)}</option>
                ))}
              </select>
            </Field>
          </div>

          {!deliveryZones.length && (
            <p className="warn">La tienda todavía no tiene municipios con precio de mensajería. Pídele al administrador que los configure en el panel (pestaña Mensajería).</p>
          )}
          {freeDelivery && (
            <p className="note">🚚 Mensajería <strong>gratis</strong>: los pedidos de menos de {money(FREE_DELIVERY_UNDER)} no pagan entrega.</p>
          )}
          {!freeDelivery && zone && commissionPreview < 0 && (
            <p className="warn">La mensajería ({money(deliveryPreview)}) supera la comisión base: en este pedido perderías {money(Math.abs(commissionPreview))}.</p>
          )}

          <div className="note checkout-commission">
            <strong>Gestor: {profile?.name ?? ''}</strong>
            <div className="sumline"><span>Precio de catálogo</span><span>{money(total)}</span></div>
            <div className="sumline"><span>Precio negociado</span><span>{money(negotiatedPreview)}</span></div>
            <div className="sumline"><span>Comisión base</span><span>{money(commissionBasePreview)}</span></div>
            <div className="sumline">
              <span>Mensajería {zone ? `· ${zone.municipality}` : ''}</span>
              <span>{zone ? (freeDelivery ? 'Gratis' : `- ${money(deliveryPreview)}`) : 'elige el municipio'}</span>
            </div>
            <div className="sumline sumline--total"><b>Comisión final</b><b>{money(commissionPreview)}</b></div>
          </div>
        </>}
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
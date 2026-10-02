'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useUI } from '@/context/UIContext';
import { useCheckout } from '@/admin/hooks/useCheckout'; // TODO: mover a '@/hooks/useCheckout'
import { formatMoney } from '@/lib/format';
import { commissionFor, managerCostOf, round2 } from '@/lib/commission';
import { FREE_DELIVERY_UNDER, deliveryFeeFor, findZone, isFreeDelivery } from '@/lib/delivery';
import { hasManagerPricing } from '@/lib/types';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';

/**
 * Convierte el texto escrito por el gestor en un número.
 * Acepta "1250", "1250.5", "1250,50". Rechaza todo lo demás (p. ej. "1,200" o "1.200,50"),
 * porque interpretarlo mal cambiaría el precio y la comisión sin avisar.
 */
function parseMoney(raw: string): number | null {
  const value = raw.trim().replace(/\s/g, '');
  if (!/^\d+([.,]\d{1,2})?$/.test(value)) return null;
  const amount = Number(value.replace(',', '.'));
  return Number.isFinite(amount) ? amount : null;
}

const MONEY_FORMAT_HINT = 'Usa solo números, por ejemplo 1250 o 1250,50.';

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

  const parsedNegotiated = parseMoney(negotiatedInput);
  const negotiatedInvalid = negotiatedInput.trim() !== '' && parsedNegotiated === null;
  const pactadoPreview = parsedNegotiated ?? 0;

  const zone = findZone(deliveryZones, zoneInput);
  const zonePrice = zone?.price ?? 0;
  const freeDelivery = isFreeDelivery(pactadoPreview || total);
  const deliveryPreview = isManager ? deliveryFeeFor(pactadoPreview, zonePrice) : 0;

  // Costo del gestor = suma de precios de gestor; el carrito ya los muestra así.
  const managerCostPreview = managerCostOf(items);
  const { commissionBase: marginPreview, commission: commissionPreview } = commissionFor(
    pactadoPreview,
    managerCostPreview,
    deliveryPreview
  );
  const belowCost =
    isManager && pactadoPreview > 0 && round2(pactadoPreview - managerCostPreview) < 0;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    const name = String(f.get('name') ?? '').trim();
    const phone = String(f.get('phone') ?? '').trim();
    const address = String(f.get('address') ?? '').trim();
    const notes = String(f.get('notes') ?? '').trim();
    const deliveryZone = String(f.get('deliveryZone') ?? '');

    // Campos que `required` no detecta (solo espacios) y formatos inválidos.
    if (!name) return setError('Escribe el nombre.');
    if (phone.replace(/\D/g, '').length < 8) {
      return setError('Escribe un teléfono válido, con al menos 8 dígitos.');
    }
    if (!address) return setError('Escribe la dirección de entrega.');

    let negotiatedTotal = 0;
    if (isManager) {
      const parsed = parseMoney(String(f.get('negotiatedTotal') ?? ''));
      if (parsed === null || parsed <= 0) {
        return setError(`Escribe un precio pactado válido. ${MONEY_FORMAT_HINT}`);
      }
      negotiatedTotal = parsed;
    }

    const customer = {
      name,
      phone,
      address,
      notes,
      negotiatedTotal,
      // El precio de mensajería lo pone el municipio elegido, no se escribe a mano.
      deliveryZone,
      deliveryFee: deliveryPreview,
    };

    setBusy(true);
    setError('');
    try {
      const err = await submit(customer); // window.open ocurre dentro, antes de cualquier await
      if (err) {
        setBusy(false);
        setError(err);
      }
    } catch {
      // Sin esto, un fallo de red dejaba el botón en "Enviando…" para siempre.
      setBusy(false);
      setError('No se pudo enviar el pedido. Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  return (
    <Modal title="Finalizar compra" onClose={close}>
      <div className="note">
        {items.map(({ product, qty }) => (
          <div className="sumline" key={product.id}>
            <span>
              {qty} × {product.name}
            </span>
            <span>{money(product.price * qty)}</span>
          </div>
        ))}
        <div className="sumline sumline--total">
          <b>Total</b>
          <b>{money(total)}</b>
        </div>
      </div>

      {!whatsappReady && (
        <p className="warn" role="alert">
          La tienda todavía no configuró su número de WhatsApp. Avísale al administrador.
        </p>
      )}

      {/* key: si el perfil llega después, el formulario se rellena con sus datos */}
      <form className="form" onSubmit={onSubmit} key={profile?.id ?? 'anon'}>
        <Field label={isManager ? 'Nombre del cliente' : 'Nombre'}>
          <input
            className="input"
            type="text"
            name="name"
            maxLength={60}
            autoComplete={isManager ? 'off' : 'name'}
            defaultValue={isManager ? '' : profile?.name ?? ''}
            placeholder={isManager ? 'Nombre de la persona que recibe' : 'Nombre completo'}
            required
          />
        </Field>
        <Field label="Teléfono de contacto">
          <input
            className="input"
            type="tel"
            name="phone"
            maxLength={20}
            autoComplete={isManager ? 'off' : 'tel'}
            defaultValue={profile?.phone ?? ''}
            required
          />
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

        {isManager && (
          <>
            <div className="two-col">
              <Field label={`Precio pactado (${settings.currency})`}>
                <input
                  className="input"
                  type="text"
                  name="negotiatedTotal"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={String(round2(total))}
                  value={negotiatedInput}
                  onChange={(event) => setNegotiatedInput(event.target.value)}
                  aria-invalid={negotiatedInvalid}
                  required
                />
                <small className="field__hint">
                  {negotiatedInvalid
                    ? MONEY_FORMAT_HINT
                    : 'Lo que pagará el cliente final (puede ser mayor que tu costo).'}
                </small>
              </Field>
              <Field label="Municipio de entrega" hint="Su precio de mensajería se descuenta de la comisión.">
                <select
                  className="input"
                  name="deliveryZone"
                  value={zoneInput}
                  onChange={(event) => setZoneInput(event.target.value)}
                  required
                >
                  <option value="">Elegir municipio…</option>
                  {deliveryZones.map((item) => (
                    <option key={item.id} value={item.municipality}>
                      {item.municipality} · {money(item.price)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {!deliveryZones.length && (
              <p className="warn">
                La tienda todavía no tiene municipios con precio de mensajería. Pídele al
                administrador que los configure en el panel (pestaña Mensajería).
              </p>
            )}

            {freeDelivery && (
              <p className="note">
                🚚 Mensajería <strong>gratis</strong>: los pedidos de menos de{' '}
                {money(FREE_DELIVERY_UNDER)} no pagan entrega.
              </p>
            )}

            {!freeDelivery && zone && commissionPreview < 0 && (
              <p className="warn">
                La mensajería ({money(deliveryPreview)}) supera tu margen: en este pedido
                perderías {money(Math.abs(commissionPreview))}.
              </p>
            )}

            {belowCost && (
              <p className="warn">
                El precio pactado es menor que tu costo ({money(managerCostPreview)}): revisa el
                precio antes de enviar.
              </p>
            )}

            <div className="note checkout-commission">
              <strong>Gestor: {profile?.name ?? ''}</strong>
              <div className="sumline">
                <span>Tu costo (carrito)</span>
                <span>{money(managerCostPreview)}</span>
              </div>
              <div className="sumline">
                <span>Precio pactado</span>
                <span>{money(pactadoPreview)}</span>
              </div>
              <div className="sumline">
                <span>Margen bruto</span>
                <span>{money(marginPreview)}</span>
              </div>
              <div className="sumline">
                <span>Mensajería {zone ? `· ${zone.municipality}` : ''}</span>
                <span>
                  {zone ? (freeDelivery ? 'Gratis' : `- ${money(deliveryPreview)}`) : 'elige el municipio'}
                </span>
              </div>
              <div className="sumline sumline--total">
                <b>Comisión del gestor</b>
                <b>{money(commissionPreview)}</b>
              </div>
            </div>
          </>
        )}

        <Field label="Notas (opcional)">
          <input
            className="input"
            type="text"
            name="notes"
            maxLength={160}
            placeholder="Horario, referencias…"
          />
        </Field>

        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" block disabled={busy || !whatsappReady}>
          {busy ? 'Enviando…' : '💬 Enviar pedido por WhatsApp'}
        </Button>
      </form>
    </Modal>
  );
}

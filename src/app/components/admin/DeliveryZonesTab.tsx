'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { translateError } from '@/lib/format';
import { FREE_DELIVERY_UNDER } from '@/lib/delivery';
import { deleteDeliveryZone, fetchAllDeliveryZones, saveDeliveryZone } from '@/services/deliveryZones';
import type { DeliveryZone } from '@/lib/types';
import Button from '../ui/Button';
import Field from '../ui/Field';

export default function DeliveryZonesTab() {
  const { settings, reloadDeliveryZones } = useStore();
  const toast = useToast();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const loadZones = useCallback(() => fetchAllDeliveryZones(), []);

  /** Recarga la lista y el store (lo usan los botones, no el efecto). */
  const refresh = useCallback(async () => {
    try {
      setZones(await loadZones());
      await reloadDeliveryZones();
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setLoaded(true);
    }
  }, [loadZones, reloadDeliveryZones]);

  // Carga inicial: la lista incluye los municipios ocultos (el store solo tiene los visibles).
  useEffect(() => {
    let active = true;
    loadZones()
      .then((rows) => active && setZones(rows))
      .catch((err) => active && setError(translateError(err instanceof Error ? err.message : undefined)))
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [loadZones]);

  const reset = () => {
    setEditing(null);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const municipality = String(form.get('municipality') ?? '').trim();
    const price = Number(String(form.get('price') ?? '').replace(',', '.'));
    const sortOrder = Math.max(0, Number(form.get('sortOrder') ?? 0));

    if (!municipality) return setError('Escribe el nombre del municipio.');
    if (!Number.isFinite(price) || price < 0) return setError('El precio de mensajería no es válido.');

    setBusy(true);
    setError('');
    try {
      await saveDeliveryZone({ municipality, price: Math.round(price * 100) / 100, sortOrder, visible: form.get('visible') === 'on' }, editing?.id);
      await refresh();
      reset();
      toast('Municipio guardado');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (zone: DeliveryZone) => {
    if (!window.confirm(`¿Eliminar ${zone.municipality} de la lista de mensajería?`)) return;
    try {
      await deleteDeliveryZone(zone.id);
      await refresh();
      toast('Municipio eliminado');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    }
  };

  const money = (value: number) => `${value.toFixed(2)} ${settings.currency}`;
  const newPosition = zones.length ? Math.max(...zones.map((zone) => zone.sortOrder)) + 1 : 1;

  return (
    <div className="delivery-admin">
      <div className="banner-admin__intro">
        <div>
          <h2>Mensajería por municipio</h2>
          <p className="muted">
            El gestor elige el municipio en el checkout y este precio se le descuenta de la comisión.
            Los pedidos de menos de {FREE_DELIVERY_UNDER.toFixed(2)} {settings.currency} tienen mensajería gratis.
          </p>
        </div>
        <Button onClick={reset}>＋ Nuevo municipio</Button>
      </div>

      <form className="delivery-form" onSubmit={submit} key={editing?.id ?? 'new-zone'}>
        <Field label="Municipio">
          <input className="input" name="municipality" maxLength={60} placeholder="Ej.: Playa" defaultValue={editing?.municipality ?? ''} required />
        </Field>
        <Field label={`Precio de mensajería (${settings.currency})`} hint="Lo que se descuenta de la comisión del gestor.">
          <input className="input" type="text" name="price" inputMode="decimal" placeholder="0.00" defaultValue={editing ? String(editing.price) : ''} required />
        </Field>
        <Field label="Orden" hint="1 aparece primero en el checkout.">
          <input className="input" type="number" name="sortOrder" min={1} step={1} defaultValue={editing ? editing.sortOrder + 1 : newPosition} />
        </Field>
        <label className="switch switch--panel">
          <input type="checkbox" name="visible" defaultChecked={editing ? editing.visible : true} />
          <span>Disponible</span>
        </label>
        <p className="form__error">{error}</p>
        <div className="banner-form__actions">
          <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir municipio'}</Button>
          {editing && <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>}
        </div>
      </form>

      <div className="banner-list-heading">
        <h3>Tarifas configuradas</h3>
        <span className="muted">{zones.length} municipios</span>
      </div>

      {!loaded ? (
        <p className="muted">Cargando municipios…</p>
      ) : zones.length === 0 ? (
        <div className="note">
          Todavía no hay municipios. Ejecuta <code>supabase_delivery.sql</code> para cargar los 15 municipios de La Habana,
          o añádelos con el formulario de arriba.
        </div>
      ) : (
        <div className="rows">
          {zones.map((zone) => (
            <div className="prow" key={zone.id}>
              <div className="prow__info">
                <strong>{zone.municipality}</strong>
                <span className="muted">Posición {zone.sortOrder + 1} · {zone.visible ? 'Disponible' : 'Oculto'}</span>
              </div>
              <strong className="delivery-price">{money(zone.price)}</strong>
              <div className="prow__actions">
                <Button variant="ghost" size="sm" onClick={() => setEditing(zone)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => void remove(zone)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
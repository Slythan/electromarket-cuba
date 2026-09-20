'use client';

import { useState, type FormEvent } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { onlyDigits, translateError } from '@/lib/format';
import { updateSettings } from '@/services/settings';
import Button from '../ui/Button';
import Field from '../ui/Field';

export default function SettingsTab() {
  const { settings, reloadSettings } = useStore();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const storeName = String(f.get('storeName') ?? '').trim();
    const currency = String(f.get('currency') ?? '').trim().toUpperCase();
    const whatsapp = onlyDigits(String(f.get('whatsapp') ?? ''));

    if (!storeName || !currency) return setError('Completa nombre y moneda.');
    if (whatsapp && whatsapp.length < 8)
      return setError('El número de WhatsApp parece incompleto (incluye el código de país).');

    setBusy(true);
    setError('');
    try {
      await updateSettings({ storeName, whatsapp, currency });
      await reloadSettings();
      toast('Configuración guardada');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-panel">
      <form className="form" onSubmit={onSubmit}>
        <Field label="Nombre de la tienda">
          <input className="input" type="text" name="storeName" maxLength={40} defaultValue={settings.storeName} required />
        </Field>
        <Field
          label="Número de WhatsApp que recibe los pedidos"
          hint="Con código de país y sin “+” ni espacios. Ej.: 5351234567"
        >
          <input
            className="input"
            type="tel"
            name="whatsapp"
            inputMode="numeric"
            placeholder="5351234567"
            defaultValue={settings.whatsapp}
          />
        </Field>
        <Field label="Moneda" hint="Se muestra junto a cada precio (USD, CUP, MLC…)">
          <input className="input" type="text" name="currency" maxLength={6} defaultValue={settings.currency} required />
        </Field>
        <p className="form__error">{error}</p>
        <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar configuración'}</Button>
      </form>
    </div>
  );
}
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney, translateError } from '@/lib/format';
import { addDays, weekLabel, weekRange } from '@/lib/week';
import { summarizeByManager, summarizeTotals } from '@/lib/managers';
import { fetchOrdersInRange } from '@/services/orders';
import type { Order } from '@/lib/types';
import Button from '../ui/Button';

export default function ManagersTab() {
  const { settings } = useStore();
  const toast = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [range, setRange] = useState(() => weekRange(0));
  const [loadedRange, setLoadedRange] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [version, setVersion] = useState(0);
  const [loadedVersion, setLoadedVersion] = useState(-1);
  const [error, setError] = useState('');

  const money = (value: number) => formatMoney(value, settings.currency);
  const rangeKey = `${range.from.toISOString()}|${range.to.toISOString()}`;

  const changeWeek = (delta: number) => {
    const next = weekOffset + delta;
    setWeekOffset(next);
    setRange(weekRange(next));
  };

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  // Se cargan los pedidos del rango elegido.
  useEffect(() => {
    let active = true;
    fetchOrdersInRange(range.from, range.to)
      .then((rows) => {
        if (!active) return;
        setOrders(rows);
        setError('');
      })
      .catch((err) => active && setError(translateError(err instanceof Error ? err.message : undefined)))
      .finally(() => {
        if (!active) return;
        setLoadedRange(rangeKey);
        setLoadedVersion(version);
      });
    return () => {
      active = false;
    };
  }, [range, rangeKey, version]);

  const loading = loadedRange !== rangeKey || loadedVersion !== version;
  const summaries = summarizeByManager(orders);
  const totals = summarizeTotals(summaries);

  /** Aviso al cambiar de semana (feedback inmediato). */
  const onReload = () => {
    reload();
    toast('Actualizando la semana…');
  };

  return (
    <div className="managers-admin">
      <div className="banner-admin__intro">
        <div>
          <h2>Cuenta de gestores · {weekLabel(range)}</h2>
          <p className="muted">
            Comisión = precio pactado − costo del gestor − mensajería. Las entregas gratis (pedidos pequeños)
            no descuentan mensajería. La semana va de lunes a domingo.
          </p>
        </div>
        <div className="managers-admin__week">
          <Button variant="ghost" size="sm" onClick={() => changeWeek(-1)}>← Semana anterior</Button>
          <span className="managers-admin__week-label">{weekOffset === 0 ? 'Semana actual' : weekLabel(range)}</span>
          <Button variant="ghost" size="sm" disabled={weekOffset >= 0} onClick={() => changeWeek(1)}>Semana siguiente →</Button>
          <Button variant="ghost" size="sm" disabled={loading} onClick={onReload}>{loading ? 'Actualizando…' : '↻'}</Button>
        </div>
      </div>

      {error && <p className="form__error">{error}</p>}

      <div className="stats">
        <div className="stat"><b>{totals.orders}</b><span className="muted">Pedidos</span></div>
        <div className="stat"><b>{money(totals.sales)}</b><span className="muted">Ventas pactadas</span></div>
        <div className="stat"><b>{money(totals.commission)}</b><span className="muted">A pagar a gestores</span></div>
        <div className="stat"><b>{money(totals.pending)}</b><span className="muted">Pendiente de cobro</span></div>
      </div>

      {loading ? (
        <p className="muted">Cargando la semana…</p>
      ) : summaries.length === 0 ? (
        <div className="note">No hay pedidos de gestor en esta semana ({weekLabel(range)}).</div>
      ) : (
        <div className="rows">
          {summaries.map((summary, index) => (
            <div className="prow manager-row" key={summary.name}>
              <span className="manager-row__rank">{index + 1}</span>
              <div className="prow__info">
                <strong>{summary.name}</strong>
                <span className="muted">
                  {summary.orders} {summary.orders === 1 ? 'pedido' : 'pedidos'} · ventas {money(summary.sales)}
                  {summary.pending > 0 && <> · pendiente {money(summary.pending)}</>}
                  {summary.collected > 0 && <> · cobrado {money(summary.collected)}</>}
                </span>
              </div>
              <div className="manager-row__amount">
                <small className="muted">Cobra esta semana</small>
                <strong>{money(summary.commission)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="field__hint">
        Rango consultado: {range.from.toLocaleDateString('es')} – {addDays(range.to, -1).toLocaleDateString('es')} ·{' '}
        {orders.length} pedidos leídos. «Cobrado» son los pedidos con estado cobrada; el resto queda pendiente.
      </p>
    </div>
  );
}
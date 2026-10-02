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
      <header className="managers-admin__header">
        <div className="managers-admin__intro">
          <div><span className="eyebrow">LIQUIDACIONES</span><h2>Resumen de gestores</h2></div>
          <p className="muted">Comisión = venta pactada − costo del gestor − mensajería.</p>
        </div>
        <nav className="managers-admin__week" aria-label="Seleccionar semana">
          <Button variant="ghost" size="sm" onClick={() => changeWeek(-1)}>← Anterior</Button>
          <div className="managers-admin__week-range" aria-live="polite">
            <strong>{weekOffset === 0 ? 'Semana actual' : 'Semana seleccionada'}</strong>
            <span>{weekLabel(range)}</span>
          </div>
          <Button variant="ghost" size="sm" disabled={weekOffset >= 0} onClick={() => changeWeek(1)}>Siguiente →</Button>
          <Button variant="ghost" size="sm" disabled={loading} onClick={onReload}>{loading ? 'Actualizando…' : '↻ Actualizar'}</Button>
        </nav>
      </header>

      {error && <p className="form__error">{error}</p>}

      <div className="manager-kpis" aria-label="Totales de la semana">
        <article className="manager-kpi manager-kpi--orders"><span>Pedidos de gestores</span><strong>{loading ? '…' : totals.orders}</strong><small>En el periodo seleccionado</small></article>
        <article className="manager-kpi manager-kpi--sales"><span>Ventas pactadas</span><strong>{loading ? '…' : money(totals.sales)}</strong><small>Importe acordado con clientes</small></article>
        <article className="manager-kpi manager-kpi--commission"><span>Comisión total</span><strong>{loading ? '…' : money(totals.commission)}</strong><small>Total correspondiente a gestores</small></article>
        <article className="manager-kpi manager-kpi--collected"><span>Comisión cobrada</span><strong>{loading ? '…' : money(totals.collected)}</strong><small>Pedidos marcados como cobrados</small></article>
        <article className="manager-kpi manager-kpi--pending"><span>Comisión pendiente</span><strong>{loading ? '…' : money(totals.pending)}</strong><small>Pedidos aún sin cobrar</small></article>
      </div>

      {loading ? (
        <div className="manager-list__state" aria-live="polite">Cargando los resultados de esta semana…</div>
      ) : summaries.length === 0 ? (
        <div className="manager-list__state"><strong>No hay pedidos de gestor esta semana</strong><span>{weekLabel(range)} · Los totales se actualizarán cuando se registren pedidos.</span></div>
      ) : (
        <section className="manager-list" aria-label="Resumen por gestor">
          <div className="manager-list__heading" aria-hidden="true"><span>Gestor</span><span>Pedidos</span><span>Ventas pactadas</span><span>Comisión total</span><span>Cobrada</span><span>Pendiente</span></div>
          {summaries.map((summary, index) => (
            <article className="manager-card" key={summary.name}>
              <div className="manager-card__person">
                <span className="manager-row__rank">{index + 1}</span>
                <div><strong>{summary.name}</strong><span>{summary.orders} {summary.orders === 1 ? 'pedido' : 'pedidos'}</span></div>
              </div>
              <div className="manager-card__metric"><small>Pedidos</small><strong>{summary.orders}</strong></div>
              <div className="manager-card__metric"><small>Ventas pactadas</small><strong>{money(summary.sales)}</strong></div>
              <div className="manager-card__metric manager-card__metric--commission"><small>Comisión total</small><strong>{money(summary.commission)}</strong></div>
              <div className="manager-card__metric manager-card__metric--collected"><small>Cobrada</small><strong>{money(summary.collected)}</strong></div>
              <div className="manager-card__metric manager-card__metric--pending"><small>Pendiente</small><strong>{money(summary.pending)}</strong></div>
            </article>
          ))}
        </section>
      )}

      <p className="managers-admin__footnote">Periodo: {range.from.toLocaleDateString('es')} – {addDays(range.to, -1).toLocaleDateString('es')}. «Cobrada» corresponde a pedidos con estado cobrada; los demás importes quedan pendientes.</p>
    </div>
  );
}
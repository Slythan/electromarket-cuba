'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney, translateError } from '@/lib/format';
import { updateOrderStatus } from '@/services/orders';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';
import Button from '../ui/Button';

interface OrdersTabProps {
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
  loading: boolean;
  onReload: () => void;
}

export default function OrdersTab({ orders, setOrders, loading, onReload }: OrdersTabProps) {
  const { settings } = useStore();
  const toast = useToast();
  const money = (n: number) => formatMoney(n, settings.currency);

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast('Estado actualizado');
    } catch (e) {
      toast(translateError(e instanceof Error ? e.message : undefined));
    }
  };

  return (
    <>
      <div className="toolbar">
        <Button variant="ghost" size="sm" onClick={onReload} disabled={loading}>
          {loading ? 'Actualizando…' : '↻ Actualizar'}
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="note">Todavía no hay pedidos.</div>
      ) : (
        <div className="rows">
          {orders.map((o) => (
            <div className="order" key={o.id}>
              <div className="order__head">
                <strong>{o.customerName}</strong>
                <select
                  className="input input--select"
                  value={o.status}
                  aria-label="Estado del pedido"
                  onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <span className="muted">
                {new Date(o.createdAt).toLocaleString('es')} · {o.phone}
              </span>
              <span>📍 {o.address}</span>
              {o.notes && <span className="muted">📝 {o.notes}</span>}
              <div>
                {o.items.map((i, idx) => (
                  <div className="sumline" key={`${i.id}-${idx}`}>
                    <span>{i.qty} × {i.name}</span>
                    <span>{money(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="sumline sumline--total">
                <b>Total</b>
                <b>{money(o.total)}</b>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
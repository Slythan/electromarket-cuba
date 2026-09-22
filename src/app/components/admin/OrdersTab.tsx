'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney, translateError } from '@/lib/format';
import { commissionFor } from '@/lib/commission';
import { deleteOrder, updateOrder, updateOrderStatus } from '@/services/orders';
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
  const statusLabels: Record<OrderStatus, string> = { creada: 'Creada', confirmada: 'Confirmada', enviada: 'Enviada', cobrada: 'Cobrada' };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ customerName: '', phone: '', address: '', total: '', managerCost: '', deliveryFee: '' });
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

  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setDraft({
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      // `total` es el precio pactado con el cliente.
      total: String(order.total),
      managerCost: order.managerCost == null ? '' : String(order.managerCost),
      deliveryFee: String(order.deliveryFee ?? 0),
    });
  };

  const saveEdit = async (order: Order) => {
    const pactado = Number(draft.total.replace(',', '.'));
    const managerCost = Number(draft.managerCost.replace(',', '.')) || 0;
    const deliveryFee = Number(draft.deliveryFee.replace(',', '.')) || 0;
    if (!draft.customerName.trim() || !draft.phone.trim() || !draft.address.trim() || !Number.isFinite(pactado) || pactado < 0)
      return toast('Completa cliente, teléfono, dirección y precio pactado válidos.');
    // Comisión del gestor = precio pactado − costo del gestor − mensajería.
    const { commissionBase, commission } = commissionFor(pactado, managerCost, deliveryFee);
    try {
      await updateOrder(order.id, {
        customerName: draft.customerName.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        total: pactado,
        negotiatedTotal: pactado,
        managerCost,
        deliveryFee,
        commissionBase,
        commission,
      });
      setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, customerName: draft.customerName.trim(), phone: draft.phone.trim(), address: draft.address.trim(), total: pactado, negotiatedTotal: pactado, managerCost, deliveryFee, commissionBase, commission } : item));
      setEditingId(null);
      toast('Pedido actualizado');
    } catch (error) { toast(translateError(error instanceof Error ? error.message : undefined)); }
  };

  const remove = async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido de ${order.customerName}?`)) return;
    try {
      await deleteOrder(order.id);
      await onReload();
      toast('Pedido eliminado');
    } catch (error) { toast(translateError(error instanceof Error ? error.message : undefined)); }
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
                    <option key={s} value={s}>{statusLabels[s]}</option>
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
              {o.managerCost != null && <div className="note"><div>Precio pactado: {money(o.total)}</div><div>Costo del gestor: {money(o.managerCost)}</div><div>Margen bruto: {money(o.commissionBase ?? 0)}</div><div>Mensajería{o.deliveryZone ? ` · ${o.deliveryZone}` : ''}: {o.deliveryFee ? money(o.deliveryFee) : 'Gratis'}</div><strong>Comisión del gestor: {money(o.commission ?? 0)}</strong></div>}
              {editingId === o.id ? <div className="order-edit form"><div className="two-col"><input className="input" value={draft.customerName} aria-label="Nombre del cliente" onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} /><input className="input" value={draft.phone} aria-label="Teléfono" onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div><textarea className="input" value={draft.address} aria-label="Dirección" onChange={(e) => setDraft({ ...draft, address: e.target.value })} /><div className="two-col"><input className="input" inputMode="decimal" value={draft.total} aria-label="Precio pactado" placeholder="Precio pactado" onChange={(e) => setDraft({ ...draft, total: e.target.value })} /><input className="input" inputMode="decimal" value={draft.managerCost} aria-label="Costo del gestor" placeholder="Costo del gestor" onChange={(e) => setDraft({ ...draft, managerCost: e.target.value })} /><input className="input" inputMode="decimal" value={draft.deliveryFee} aria-label="Mensajería" placeholder="Mensajería" onChange={(e) => setDraft({ ...draft, deliveryFee: e.target.value })} /></div><div className="banner-form__actions"><Button size="sm" onClick={() => void saveEdit(o)}>Guardar</Button><Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button></div></div> : <div className="order__actions"><Button variant="ghost" size="sm" onClick={() => startEdit(o)}>Editar pedido</Button><Button variant="danger" size="sm" onClick={() => void remove(o)}>Eliminar</Button></div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
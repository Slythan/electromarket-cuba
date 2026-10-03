import { supabase } from '@/lib/supabase';
import { mapOrder, type OrderRow } from '@/lib/mappers';
import type { CustomerData, Order, OrderItem, OrderStatus } from '@/lib/types';

export async function fetchOrders(limit = 100, userId?: string): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as OrderRow[]).map(mapOrder);
}

/** Pedidos creados en el rango [from, to) — para el resumen semanal de gestores. */
export async function fetchOrdersInRange(from: Date, to: Date, limit = 500): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', from.toISOString())
    .lt('created_at', to.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as OrderRow[]).map(mapOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export interface CreateOrderItemInput {
  id: string;
  qty: number;
  expectedPrice: number;
}

interface CreateOrderInput {
  idempotencyKey: string;
  customer: Pick<CustomerData, 'name' | 'phone' | 'address' | 'notes'>;
  items: CreateOrderItemInput[];
  negotiatedTotal?: number | null;
  expectedDeliveryFee: number;
  deliveryZone?: string | null;
}

export interface CreatedOrder {
  id: string;
  items: OrderItem[];
  total: number;
  managerCost: number | null;
  commissionBase: number | null;
  deliveryFee: number;
  commission: number | null;
  managerName: string | null;
  deliveryZone: string | null;
}

export async function createOrder({ idempotencyKey, customer, items, negotiatedTotal, expectedDeliveryFee, deliveryZone }: CreateOrderInput): Promise<CreatedOrder> {
  const { data, error } = await supabase.rpc('create_order_with_inventory', {
    p_idempotency_key: idempotencyKey,
    p_customer: customer,
    p_items: items.map(({ id, qty }) => ({ id, qty })),
    p_expected_items: items.map(({ id, qty, expectedPrice }) => ({ id, qty, expectedPrice })),
    p_negotiated_total: negotiatedTotal ?? null,
    p_expected_delivery_fee: expectedDeliveryFee,
    p_delivery_zone: deliveryZone ?? null,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object') throw new Error('Supabase no devolvió la confirmación del pedido.');
  return data as CreatedOrder;
}

export async function updateOrder(id: string, input: Partial<Pick<Order, 'customerName' | 'phone' | 'address' | 'notes' | 'total' | 'negotiatedTotal' | 'managerCost' | 'commissionBase' | 'deliveryFee' | 'commission' | 'deliveryZone'>>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (input.customerName !== undefined) row.customer_name = input.customerName;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.address !== undefined) row.address = input.address;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.total !== undefined) row.total = input.total;
  if (input.negotiatedTotal !== undefined) row.negotiated_total = input.negotiatedTotal;
  if (input.managerCost !== undefined) row.manager_cost = input.managerCost;
  if (input.commissionBase !== undefined) row.commission_base = input.commissionBase;
  if (input.deliveryFee !== undefined) row.delivery_fee = input.deliveryFee;
  if (input.commission !== undefined) row.commission = input.commission;
  if (input.deliveryZone !== undefined) row.delivery_zone = input.deliveryZone;
  const { error } = await supabase.from('orders').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteOrder(id: string): Promise<void> {
  const { data, error } = await supabase.from('orders').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('No se pudo eliminar el pedido. Ejecuta la política de eliminación de supabase_orders.sql y verifica que tu cuenta sea administradora.');
}
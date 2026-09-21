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

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

interface CreateOrderInput {
  userId: string;
  customer: CustomerData;
  items: OrderItem[];
  total: number;
  negotiatedTotal?: number | null;
  commissionBase?: number | null;
  deliveryFee?: number | null;
  commission?: number | null;
  managerName?: string | null;
}

export async function createOrder({ userId, customer, items, total, negotiatedTotal, commissionBase, deliveryFee, commission, managerName }: CreateOrderInput): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    user_id: userId,
    customer_name: customer.name,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    items,
    total,
    status: 'creada',
    negotiated_total: negotiatedTotal ?? null,
    commission_base: commissionBase ?? null,
    delivery_fee: deliveryFee ?? null,
    commission: commission ?? null,
    manager_name: managerName ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function updateOrder(id: string, input: Partial<Pick<Order, 'customerName' | 'phone' | 'address' | 'notes' | 'total' | 'negotiatedTotal' | 'commissionBase' | 'deliveryFee' | 'commission'>>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (input.customerName !== undefined) row.customer_name = input.customerName;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.address !== undefined) row.address = input.address;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.total !== undefined) row.total = input.total;
  if (input.negotiatedTotal !== undefined) row.negotiated_total = input.negotiatedTotal;
  if (input.commissionBase !== undefined) row.commission_base = input.commissionBase;
  if (input.deliveryFee !== undefined) row.delivery_fee = input.deliveryFee;
  if (input.commission !== undefined) row.commission = input.commission;
  const { error } = await supabase.from('orders').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
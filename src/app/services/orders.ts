import { supabase } from '@/lib/supabase';
import { mapOrder, type OrderRow } from '@/lib/mappers';
import type { CustomerData, Order, OrderItem, OrderStatus } from '@/lib/types';

export async function fetchOrders(limit = 100): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
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
}

export async function createOrder({ userId, customer, items, total }: CreateOrderInput): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    user_id: userId,
    customer_name: customer.name,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    items,
    total,
  });
  if (error) throw new Error(error.message);
}
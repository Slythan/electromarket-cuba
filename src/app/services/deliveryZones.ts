import { supabase } from '@/lib/supabase';
import type { DeliveryZone } from '@/lib/types';

interface DeliveryZoneRow {
  id: string;
  municipality: string;
  price: number | string;
  sort_order: number;
  visible: boolean;
}

const mapZone = (row: DeliveryZoneRow): DeliveryZone => ({
  id: row.id,
  municipality: row.municipality,
  price: Number(row.price),
  sortOrder: row.sort_order,
  visible: row.visible,
});

export interface DeliveryZoneInput {
  municipality: string;
  price: number;
  sortOrder: number;
  visible: boolean;
}

/** Municipios publicados (los que puede elegir el gestor). */
export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('visible', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DeliveryZoneRow[]).map(mapZone);
}

/** Todos los municipios, incluidos los ocultos (panel de administración). */
export async function fetchAllDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase.from('delivery_zones').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DeliveryZoneRow[]).map(mapZone);
}

/** Crea el municipio, o lo actualiza si se pasa `id`. */
export async function saveDeliveryZone(input: DeliveryZoneInput, id?: string): Promise<void> {
  const row = {
    municipality: input.municipality,
    price: input.price,
    sort_order: input.sortOrder,
    visible: input.visible,
  };
  const { error } = id
    ? await supabase.from('delivery_zones').update(row).eq('id', id)
    : await supabase.from('delivery_zones').insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
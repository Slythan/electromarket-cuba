import { supabase } from '@/lib/supabase';
import { mapProduct, type ProductRow } from '@/lib/mappers';
import type { Product } from '@/lib/types';

const BUCKET = 'product-images';

export interface ProductInput {
  name: string;
  price: number;
  stock: number | null;
  description: string;
  imageUrl: string | null;
  visible: boolean;
  categoryId?: string | null;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

/** Crea el producto, o lo actualiza si se pasa `id`. */
export async function saveProduct(input: ProductInput, id?: string): Promise<void> {
  const row = {
    name: input.name,
    price: input.price,
    stock: input.stock,
    description: input.description,
    image_url: input.imageUrl,
    visible: input.visible,
    category_id: input.categoryId ?? null,
  };
  const { error } = id
    ? await supabase.from('products').update(row).eq('id', id)
    : await supabase.from('products').insert(row);
  if (error) throw new Error(error.message);
}

export async function setProductVisible(id: string, visible: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ visible }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Sube la imagen al bucket público y devuelve su URL. */
export async function uploadProductImage(blob: Blob): Promise<string> {
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600' });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Borra una imagen anterior (si falla no pasa nada). */
export async function removeProductImage(url?: string | null): Promise<void> {
  const path = url?.split(`/${BUCKET}/`)[1]?.split('?')[0];
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
  } catch {
    /* no es crítico */
  }
}
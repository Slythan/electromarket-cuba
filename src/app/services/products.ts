import { supabase } from '@/lib/supabase';
import { mapProduct, type ProductRow } from '@/lib/mappers';
import type { Product } from '@/lib/types';

const BUCKET = 'product-images';

export interface ProductInput {
  name: string;
  price: number;
  managerPrice: number;
  stock: number | null;
  description: string;
  /** Hasta 3 fotos; la primera es la portada (se guarda además en `image_url`). */
  imageUrls: string[];
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

/** Un producto por id (para su página propia). Devuelve null si no existe o está oculto. */
export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as ProductRow) : null;
}

export async function fetchProductsByCategoryIds(categoryIds: string[]): Promise<Product[]> {
  if (!categoryIds.length) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('category_id', categoryIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

/** Crea el producto, o lo actualiza si se pasa `id`. */
export async function saveProduct(input: ProductInput, id?: string): Promise<void> {
  const row = {
    name: input.name,
    price: input.price,
    manager_price: input.managerPrice,
    stock: input.stock,
    description: input.description,
    image_url: input.imageUrls[0] ?? null,
    image_urls: input.imageUrls,
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
  const path = `products/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600' });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Ruta dentro del bucket a partir de su URL pública. */
export const productImagePath = (url?: string | null): string | null => {
  const path = url?.split(`/${BUCKET}/`)[1]?.split('?')[0];
  return path ? decodeURIComponent(path) : null;
};

/** Borra las fotos que el producto ya no usa (si falla no pasa nada). */
export async function removeProductImages(urls: (string | null | undefined)[]): Promise<void> {
  const paths = urls.map(productImagePath).filter((path): path is string => Boolean(path));
  if (!paths.length) return;
  try {
    await supabase.storage.from(BUCKET).remove(paths);
  } catch {
    /* no es crítico */
  }
}

/** Borra una sola foto (si falla no pasa nada). */
export const removeProductImage = (url?: string | null): Promise<void> => removeProductImages([url]);
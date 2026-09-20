import { supabase } from '@/lib/supabase';
import { mapCategory, type CategoryRow } from '@/lib/mappers';
import type { Category } from '@/lib/types';

const BUCKET = 'product-images';

export interface CategoryInput {
  name: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  visible: boolean;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('visible', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CategoryRow[]).map(mapCategory);
}

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CategoryRow[]).map(mapCategory);
}

export async function saveCategory(input: CategoryInput, id?: string): Promise<void> {
  const row = {
    name: input.name,
    image_url: input.imageUrl,
    parent_id: input.parentId,
    sort_order: input.sortOrder,
    visible: input.visible,
  };
  const { error } = id
    ? await supabase.from('categories').update(row).eq('id', id)
    : await supabase.from('categories').insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadCategoryImage(blob: Blob): Promise<string> {
  const path = `categories/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeCategoryImage(url?: string | null): Promise<void> {
  const path = url?.split(`/${BUCKET}/`)[1]?.split('?')[0];
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
  } catch {
    /* no es crítico */
  }
}

import { supabase } from '@/lib/supabase';
import { mapBanner, type BannerRow } from '@/lib/mappers';
import type { Banner } from '@/lib/types';

const BUCKET = 'product-images';

export interface BannerInput {
  imageUrl: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  visible: boolean;
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('visible', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BannerRow[]).map(mapBanner);
}

export async function fetchAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BannerRow[]).map(mapBanner);
}

export async function saveBanner(input: BannerInput, id?: string): Promise<void> {
  const row = {
    image_url: input.imageUrl,
    title: input.title,
    subtitle: input.subtitle,
    sort_order: input.sortOrder,
    visible: input.visible,
  };
  const { error } = id
    ? await supabase.from('banners').update(row).eq('id', id)
    : await supabase.from('banners').insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadBannerImage(blob: Blob): Promise<string> {
  const path = `banners/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeBannerImage(url?: string | null): Promise<void> {
  const path = url?.split(`/${BUCKET}/`)[1]?.split('?')[0];
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
  } catch {
    /* no es crítico */
  }
}

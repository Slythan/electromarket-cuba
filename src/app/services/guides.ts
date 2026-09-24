import { supabase } from '@/lib/supabase';
import { parseGuideContent, estimateReadingTime, type Article } from '@/lib/articles';

const BUCKET = 'product-images';

export interface GuideRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image: string | null;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuideInput {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  coverImage: string | null;
  content: string;
  published: boolean;
}

export function mapGuide(row: GuideRow): Article {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.created_at,
    readingTime: estimateReadingTime(row.content),
    tag: row.tag,
    coverImage: row.cover_image,
    blocks: parseGuideContent(row.content),
  };
}

/** Guías publicadas, para las páginas públicas. */
export async function fetchPublishedGuides(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as GuideRow[]).map(mapGuide);
}

/** Una guía publicada por slug (página pública). */
export async function fetchPublishedGuide(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapGuide(data as GuideRow) : null;
}

/** Todas las guías (panel admin; RLS limita a administradores). */
export async function fetchAllGuides(): Promise<GuideRow[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as GuideRow[];
}

export async function saveGuide(input: GuideInput, id?: string): Promise<void> {
  const row = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    tag: input.tag,
    cover_image: input.coverImage,
    content: input.content,
    published: input.published,
    updated_at: new Date().toISOString(),
  };
  const { error } = id
    ? await supabase.from('guides').update(row).eq('id', id)
    : await supabase.from('guides').insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteGuide(id: string): Promise<void> {
  const { error } = await supabase.from('guides').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadGuideImage(blob: Blob): Promise<string> {
  const path = `guides/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Genera un slug URL-friendly a partir del título. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

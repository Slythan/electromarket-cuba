-- Ejecutar una vez en Supabase SQL Editor después del esquema principal.
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null default '',
  subtitle text not null default '',
  title_color text not null default '#ffffff',
  subtitle_color text not null default '#a9bdd8',
  accent_color text not null default '#00d5f5',
  font_family text not null default 'display' check (font_family in ('display', 'clean', 'mono')),
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.banners add column if not exists title_color text not null default '#ffffff';
alter table public.banners add column if not exists subtitle_color text not null default '#a9bdd8';
alter table public.banners add column if not exists accent_color text not null default '#00d5f5';
alter table public.banners add column if not exists font_family text not null default 'display';
alter table public.banners drop constraint if exists banners_font_family_check;
alter table public.banners add constraint banners_font_family_check check (font_family in ('display', 'clean', 'mono'));

alter table public.banners enable row level security;

drop policy if exists "banners visibles" on public.banners;
create policy "banners visibles" on public.banners
  for select using (visible = true or public.is_admin());

drop policy if exists "admin inserta banners" on public.banners;
create policy "admin inserta banners" on public.banners
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita banners" on public.banners;
create policy "admin edita banners" on public.banners
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin borra banners" on public.banners;
create policy "admin borra banners" on public.banners
  for delete to authenticated using (public.is_admin());
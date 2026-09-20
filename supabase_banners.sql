-- Ejecutar una vez en Supabase SQL Editor después del esquema principal.
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null default '',
  subtitle text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

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
-- Ejecutar una vez en Supabase SQL Editor después del esquema principal.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  parent_id uuid references public.categories(id) on delete cascade,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.categories enable row level security;

drop policy if exists "categorias visibles" on public.categories;
create policy "categorias visibles" on public.categories
  for select using (visible = true or public.is_admin());

drop policy if exists "admin inserta categorias" on public.categories;
create policy "admin inserta categorias" on public.categories
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita categorias" on public.categories;
create policy "admin edita categorias" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin borra categorias" on public.categories;
create policy "admin borra categorias" on public.categories
  for delete to authenticated using (public.is_admin());
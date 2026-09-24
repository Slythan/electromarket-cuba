-- Guías y consejos (blog). Ejecutar una vez en Supabase SQL Editor.
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  tag text not null default 'General',
  cover_image text,
  -- Contenido en formato texto con marcadores:
  --   líneas "## Título" -> encabezado, "- item" -> lista, "[imagen]URL[/imagen]" -> imagen,
  --   "[boton]URL|Texto[/boton]" -> botón, resto -> párrafos (separados por línea en blanco).
  content text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guides enable row level security;

drop policy if exists "guias publicadas visibles" on public.guides;
create policy "guias publicadas visibles" on public.guides
  for select using (published = true or public.is_admin());

drop policy if exists "admin inserta guias" on public.guides;
create policy "admin inserta guias" on public.guides
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita guias" on public.guides;
create policy "admin edita guias" on public.guides
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin borra guias" on public.guides;
create policy "admin borra guias" on public.guides
  for delete to authenticated using (public.is_admin());

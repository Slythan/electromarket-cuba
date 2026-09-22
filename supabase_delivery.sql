-- =============================================================================
-- MENSAJERÍA POR MUNICIPIOS (La Habana)
-- Ejecuta TODO el archivo de una sola vez: Supabase → SQL Editor → New query → Run.
-- No selecciones solo una parte: si hay texto seleccionado, el editor ejecuta
-- únicamente la selección (ese es el motivo de que queden cosas sin aplicar).
-- Es idempotente: puedes repetirlo cuantas veces quieras.
-- =============================================================================

-- 1) Tabla de municipios con su precio de mensajería.
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  municipality text not null,
  price numeric not null default 0 check (price >= 0),
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Permisos (lo que faltaba): todos leen, solo el administrador crea/edita/borra.
alter table public.delivery_zones enable row level security;

drop policy if exists "municipios visibles" on public.delivery_zones;
create policy "municipios visibles" on public.delivery_zones
  for select using (visible = true or public.is_admin());

drop policy if exists "admin inserta municipios" on public.delivery_zones;
create policy "admin inserta municipios" on public.delivery_zones
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita municipios" on public.delivery_zones;
create policy "admin edita municipios" on public.delivery_zones
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin borra municipios" on public.delivery_zones;
create policy "admin borra municipios" on public.delivery_zones
  for delete to authenticated using (public.is_admin());

-- 3) Precios de referencia de los 15 municipios de La Habana.
--    Solo añade los que falten: no toca los precios que ya hayas editado en el panel.
insert into public.delivery_zones (municipality, price, sort_order)
select v.municipality, v.price, v.sort_order
from (values
  ('Centro Habana', 1.00, 1),
  ('Habana Vieja', 1.00, 2),
  ('Cerro', 1.50, 3),
  ('Plaza de la Revolución', 1.50, 4),
  ('Diez de Octubre', 2.00, 5),
  ('Marianao', 2.00, 6),
  ('San Miguel del Padrón', 2.50, 7),
  ('Regla', 2.50, 8),
  ('Guanabacoa', 3.00, 9),
  ('La Lisa', 3.00, 10),
  ('Arroyo Naranjo', 3.00, 11),
  ('Boyeros', 3.50, 12),
  ('Cotorro', 4.00, 13),
  ('Habana del Este', 4.00, 14),
  ('Playa', 4.00, 15)
) as v(municipality, price, sort_order)
where not exists (select 1 from public.delivery_zones z where z.municipality = v.municipality);

-- 4) El pedido guarda el municipio al que se entregó.
alter table public.orders add column if not exists delivery_zone text;

-- 5) Verificación: debe devolver 15 filas con su precio.
select municipality, price, sort_order, visible
  from public.delivery_zones
 order by sort_order;

-- 6) Un municipio no puede repetirse (opcional: solo si faltaba la regla).
create unique index if not exists delivery_zones_municipality_uidx
  on public.delivery_zones (municipality);
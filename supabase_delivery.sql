-- Ejecutar una vez en Supabase SQL Editor.
-- Base de datos de mensajería: precio predefinido por municipio de La Habana.
-- El gestor elige el municipio en el checkout y ese precio se le descuenta de la comisión.
-- Regla de la tienda: si el pedido vale menos de 5 USD, la mensajería es gratis
-- (se aplica en la app: src/app/lib/delivery.ts -> FREE_DELIVERY_UNDER).

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  municipality text not null unique,
  price numeric not null default 0 check (price >= 0),
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Precios iniciales de referencia para los 15 municipios de La Habana.
-- Ajústalos a tu tarifa real: se pueden editar desde el panel (pestaña Mensajería).
insert into public.delivery_zones (municipality, price, sort_order) values
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
on conflict (municipality) do nothing;

-- El pedido deja constancia del municipio al que se entregó.
alter table public.orders add column if not exists delivery_zone text;

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
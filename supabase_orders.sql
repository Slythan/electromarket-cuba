-- Ejecutar una vez en Supabase para guardar la liquidación de pedidos de gestores.
-- Primero se elimina la restricción antigua para poder migrar sus valores.
alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = 'creada' where status = 'nuevo';
update public.orders set status = 'confirmada' where status = 'confirmado';
update public.orders set status = 'enviada' where status = 'entregado';
update public.orders set status = 'cobrada' where status = 'cancelado';
alter table public.orders add constraint orders_status_check check (status in ('creada', 'confirmada', 'enviada', 'cobrada'));
alter table public.orders alter column status set default 'creada';
alter table public.orders add column if not exists negotiated_total numeric;
alter table public.orders add column if not exists commission_base numeric;
alter table public.orders add column if not exists delivery_fee numeric not null default 0;
alter table public.orders add column if not exists commission numeric;
alter table public.orders add column if not exists manager_name text;

alter table public.orders enable row level security;
drop policy if exists "admin actualiza pedidos" on public.orders;
create policy "admin actualiza pedidos" on public.orders
	for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin elimina pedidos" on public.orders;
create policy "admin elimina pedidos" on public.orders
	for delete to authenticated using (public.is_admin());
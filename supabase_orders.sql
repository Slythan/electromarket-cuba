-- Ejecutar una vez en Supabase para guardar la liquidación de pedidos de gestores.
alter table public.orders add column if not exists negotiated_total numeric;
alter table public.orders add column if not exists commission_base numeric;
alter table public.orders add column if not exists delivery_fee numeric not null default 0;
alter table public.orders add column if not exists commission numeric;
alter table public.orders add column if not exists manager_name text;
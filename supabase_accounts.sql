-- Ejecutar después del esquema principal para habilitar roles, precios y solicitudes.
alter table public.products add column if not exists manager_price numeric not null default 0;
update public.products set manager_price = price where manager_price = 0;

-- Los perfiles nuevos siguen siendo clientes. Solo un administrador puede cambiar roles.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'customer'));

drop policy if exists "usuarios leen su perfil" on public.profiles;
create policy "usuarios leen su perfil" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "admin cambia roles" on public.profiles;
create policy "admin cambia roles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.manager_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.manager_requests enable row level security;
drop policy if exists "cliente crea solicitud gestor" on public.manager_requests;
create policy "cliente crea solicitud gestor" on public.manager_requests
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "cliente ve su solicitud gestor" on public.manager_requests;
create policy "cliente ve su solicitud gestor" on public.manager_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin gestiona solicitudes gestor" on public.manager_requests;
create policy "admin gestiona solicitudes gestor" on public.manager_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- El usuario ve sus órdenes y el administrador mantiene la vista global.
drop policy if exists "usuario ve sus pedidos" on public.orders;
create policy "usuario ve sus pedidos" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
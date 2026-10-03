-- Execute after supabase_orders.sql, supabase_accounts.sql, and supabase_delivery.sql.
-- Order prices, manager commissions, and stock reservations are authoritative here.

begin;

alter table public.orders
  add column if not exists idempotency_key uuid,
  add column if not exists stock_reserved boolean not null default false,
  add column if not exists stock_released boolean not null default false;

create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('creada', 'confirmada', 'enviada', 'cobrada', 'cancelada'));

drop policy if exists "usuario crea sus pedidos" on public.orders;

create or replace function public.release_order_stock()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_item record;
  v_product_id uuid;
  v_quantity integer;
begin
  if tg_op = 'DELETE' then
    if old.status in ('creada', 'confirmada') and old.stock_reserved and not old.stock_released then
      for v_item in
        select value
          from jsonb_array_elements(old.items::jsonb) as line(value)
         where coalesce((value ->> 'stockManaged')::boolean, false)
         order by (value ->> 'id')::uuid
      loop
        v_product_id := (v_item.value ->> 'id')::uuid;
        v_quantity := (v_item.value ->> 'qty')::integer;
        update public.products
           set stock = stock + v_quantity
         where id = v_product_id
           and stock is not null;
      end loop;
    end if;
    return old;
  end if;

  if old.status = 'cancelada' and new.status <> old.status then
    raise exception 'Un pedido cancelado no puede reabrirse.';
  end if;

  if new.status = 'cancelada' and old.status <> 'cancelada' then
    if old.stock_reserved and not old.stock_released then
      for v_item in
        select value
          from jsonb_array_elements(old.items::jsonb) as line(value)
         where coalesce((value ->> 'stockManaged')::boolean, false)
         order by (value ->> 'id')::uuid
      loop
        v_product_id := (v_item.value ->> 'id')::uuid;
        v_quantity := (v_item.value ->> 'qty')::integer;
        update public.products
           set stock = stock + v_quantity
         where id = v_product_id
           and stock is not null;
      end loop;
    end if;
    new.stock_released := true;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_release_stock_on_cancel on public.orders;
create trigger orders_release_stock_on_cancel
before update of status on public.orders
for each row execute function public.release_order_stock();

drop trigger if exists orders_release_stock_on_delete on public.orders;
create trigger orders_release_stock_on_delete
before delete on public.orders
for each row execute function public.release_order_stock();

create or replace function public.create_order_with_inventory(
  p_idempotency_key uuid,
  p_customer jsonb,
  p_items jsonb,
  p_expected_items jsonb,
  p_negotiated_total numeric default null,
  p_delivery_zone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_profile_name text;
  v_customer_name text;
  v_phone text;
  v_address text;
  v_notes text;
  v_item_count integer;
  v_unique_count integer;
  v_item record;
  v_product record;
  v_expected_price numeric;
  v_unit_price numeric;
  v_items jsonb := '[]'::jsonb;
  v_items_cost numeric := 0;
  v_manager_cost numeric := 0;
  v_total numeric;
  v_delivery_fee numeric := 0;
  v_zone_price numeric;
  v_zone_name text;
  v_commission_base numeric;
  v_commission numeric;
  v_has_reserved_stock boolean := false;
  v_order_id uuid;
  v_existing public.orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'Inicia sesión antes de crear un pedido.' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'Falta el identificador seguro del intento de compra.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  select * into v_existing
    from public.orders
   where idempotency_key = p_idempotency_key
   for update;

  if found then
    if v_existing.user_id <> v_user_id then
      raise exception 'El identificador de compra ya fue utilizado.' using errcode = '42501';
    end if;
    return jsonb_build_object(
      'id', v_existing.id,
      'items', v_existing.items,
      'total', v_existing.total,
      'managerCost', v_existing.manager_cost,
      'commissionBase', v_existing.commission_base,
      'deliveryFee', v_existing.delivery_fee,
      'commission', v_existing.commission,
      'managerName', v_existing.manager_name,
      'deliveryZone', v_existing.delivery_zone
    );
  end if;

  select role, name into v_role, v_profile_name
    from public.profiles
   where id = v_user_id;
  if not found then
    raise exception 'No se encontró el perfil de la cuenta.';
  end if;

  if jsonb_typeof(p_customer) is distinct from 'object' then
    raise exception 'Los datos del cliente no son válidos.';
  end if;
  v_customer_name := nullif(btrim(p_customer ->> 'name'), '');
  v_phone := nullif(btrim(p_customer ->> 'phone'), '');
  v_address := nullif(btrim(p_customer ->> 'address'), '');
  v_notes := nullif(btrim(p_customer ->> 'notes'), '');
  if v_customer_name is null or length(v_customer_name) > 60
     or v_phone is null or length(v_phone) > 20
     or v_address is null or length(v_address) > 240
      or length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 8
     or length(coalesce(v_notes, '')) > 160 then
    raise exception 'Nombre, teléfono o dirección no válidos.';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_typeof(p_expected_items) is distinct from 'array' then
    raise exception 'La lista de productos no es válida.';
  end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 50
     or jsonb_array_length(p_expected_items) <> v_item_count then
    raise exception 'El pedido debe tener entre 1 y 50 productos.';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_items) as line(value)
     where jsonb_typeof(value) is distinct from 'object'
        or coalesce(value ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(value ->> 'qty', '') !~ '^[1-9][0-9]{0,4}$'
  ) or exists (
    select 1
      from jsonb_array_elements(p_expected_items) as line(value)
     where jsonb_typeof(value) is distinct from 'object'
        or coalesce(value ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(value ->> 'qty', '') !~ '^[1-9][0-9]{0,4}$'
        or jsonb_typeof(value -> 'expectedPrice') is distinct from 'number'
  ) then
    raise exception 'La lista de productos contiene datos no válidos.';
  end if;

  select count(distinct value ->> 'id') into v_unique_count
    from jsonb_array_elements(p_items) as line(value);
  if v_unique_count <> v_item_count then
    raise exception 'El pedido contiene productos repetidos.';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_items) as requested(value)
      join jsonb_array_elements(p_expected_items) as expected(value)
        on expected.value ->> 'id' = requested.value ->> 'id'
     where expected.value ->> 'qty' <> requested.value ->> 'qty'
  ) then
    raise exception 'La cantidad del carrito cambió. Revisa el pedido e inténtalo de nuevo.';
  end if;

  for v_item in
    select (value ->> 'id')::uuid as product_id,
           (value ->> 'qty')::integer as quantity
      from jsonb_array_elements(p_items) as line(value)
     order by (value ->> 'id')::uuid
  loop
    select id, name, price, manager_price, stock, visible
      into v_product
      from public.products
     where id = v_item.product_id
     for update;

    if not found then
      raise exception 'Uno de los productos del carrito ya no existe.';
    end if;
    if not v_product.visible and v_role <> 'admin' then
      raise exception 'El producto "%" ya no está disponible.', v_product.name;
    end if;
    if v_product.stock is not null and v_product.stock < v_item.quantity then
      raise exception using
        message = format('STOCK_CHANGED: %s; disponibles: %s.', v_product.name, v_product.stock);
    end if;

    v_unit_price := round(
      case when v_role in ('admin', 'manager') then v_product.manager_price else v_product.price end,
      2
    );
    select round((value ->> 'expectedPrice')::numeric, 2)
      into v_expected_price
      from jsonb_array_elements(p_expected_items) as line(value)
     where value ->> 'id' = v_product.id::text;
    if v_expected_price is distinct from v_unit_price then
      raise exception using
        message = format('PRICE_CHANGED: %s; actualizamos los precios del carrito. Revisa y confirma otra vez.', v_product.name);
    end if;
    if v_unit_price < 0 then
      raise exception 'El producto "%" tiene un precio no válido.', v_product.name;
    end if;

    v_items_cost := v_items_cost + v_unit_price * v_item.quantity;
    v_manager_cost := v_manager_cost + round(v_product.manager_price, 2) * v_item.quantity;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_unit_price,
      'qty', v_item.quantity,
      'stockManaged', v_product.stock is not null
    ));

    if v_product.stock is not null then
      v_has_reserved_stock := true;
      update public.products
         set stock = stock - v_item.quantity
       where id = v_product.id;
    end if;
  end loop;

  v_items_cost := round(v_items_cost, 2);
  v_manager_cost := round(v_manager_cost, 2);

  if v_role in ('admin', 'manager') then
    if p_negotiated_total is null
       or p_negotiated_total::text in ('NaN', 'Infinity', '-Infinity')
       or p_negotiated_total <= 0 then
      raise exception 'El precio pactado debe ser mayor que cero.';
    end if;
    v_total := round(p_negotiated_total, 2);
    if v_total < v_manager_cost then
      raise exception 'El precio pactado no puede ser menor que el costo del gestor (%).', v_manager_cost;
    end if;

    if nullif(btrim(p_delivery_zone), '') is null then
      raise exception 'Elige el municipio de entrega.';
    end if;
    select municipality, price into v_zone_name, v_zone_price
      from public.delivery_zones
     where municipality = btrim(p_delivery_zone)
       and visible = true
     for share;
    if not found then
      raise exception 'El municipio de entrega ya no está disponible. Actualiza la página.';
    end if;
    -- Mantener este mínimo sincronizado con FREE_DELIVERY_UNDER en lib/delivery.ts.
    v_delivery_fee := case when v_total < 5 then 0 else round(v_zone_price, 2) end;
    v_commission_base := round(v_total - v_manager_cost, 2);
    v_commission := round(v_commission_base - v_delivery_fee, 2);
  else
    v_total := v_items_cost;
  end if;

  insert into public.orders (
    user_id, customer_name, phone, address, notes, items, total, status,
    negotiated_total, manager_cost, commission_base, delivery_fee, commission,
    manager_name, delivery_zone, idempotency_key, stock_reserved
  ) values (
    v_user_id, v_customer_name, v_phone, v_address, v_notes, v_items, v_total, 'creada',
    case when v_role in ('admin', 'manager') then v_total else null end,
    case when v_role in ('admin', 'manager') then v_manager_cost else null end,
    v_commission_base, v_delivery_fee, v_commission,
    case when v_role in ('admin', 'manager') then v_profile_name else null end,
    v_zone_name, p_idempotency_key, v_has_reserved_stock
  ) returning id into v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'items', v_items,
    'total', v_total,
    'managerCost', case when v_role in ('admin', 'manager') then v_manager_cost else null end,
    'commissionBase', v_commission_base,
    'deliveryFee', v_delivery_fee,
    'commission', v_commission,
    'managerName', case when v_role in ('admin', 'manager') then v_profile_name else null end,
    'deliveryZone', v_zone_name
  );
end;
$$;

revoke all on function public.create_order_with_inventory(uuid, jsonb, jsonb, jsonb, numeric, text) from public, anon;
grant execute on function public.create_order_with_inventory(uuid, jsonb, jsonb, jsonb, numeric, text) to authenticated;
revoke all on function public.release_order_stock() from public, anon, authenticated;

commit;
-- Ejecutar una vez en Supabase SQL Editor para que cada producto tenga hasta 3 fotos.
-- La portada sigue guardándose en image_url: así el código antiguo sigue funcionando.

alter table public.products add column if not exists image_urls text[] not null default '{}';

-- Los productos que ya existían usan image_url: se copia como primera foto.
update public.products
   set image_urls = array[image_url]
 where image_url is not null
   and image_url <> ''
   and coalesce(array_length(image_urls, 1), 0) = 0;

-- Como máximo 3 fotos por producto.
alter table public.products drop constraint if exists products_image_urls_max;
alter table public.products add constraint products_image_urls_max
  check (coalesce(array_length(image_urls, 1), 0) <= 3);

-- Mantiene sincronizadas la portada (image_url) y la lista de fotos (image_urls)
-- aunque se edite un producto directamente desde el panel de Supabase.
create or replace function public.products_sync_cover() returns trigger language plpgsql as $$
begin
  if coalesce(array_length(new.image_urls, 1), 0) > 0 then
    new.image_url := new.image_urls[1];
  elsif new.image_url is not null and new.image_url <> '' then
    new.image_urls := array[new.image_url];
  end if;
  return new;
end $$;

drop trigger if exists products_sync_cover on public.products;
create trigger products_sync_cover
  before insert or update on public.products
  for each row execute function public.products_sync_cover();

import type { Banner, Category, Order, OrderItem, OrderStatus, Product, Profile, Role, Settings } from './types';

/* Filas tal como vienen de la base de datos (snake_case) */
interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  manager_price?: number | string | null;
  stock: number | null;
  description: string | null;
  image_url: string | null;
  image_urls?: string[] | null;
  visible: boolean;
  category_id?: string | null;
}
interface CategoryRow {
  id: string;
  name: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  visible: boolean;
}
interface ProfileRow {
  id: string;
  name: string | null;
  phone: string | null;
  role: string;
}
interface SettingsRow {
  store_name: string;
  whatsapp: string;
  currency: string;
}
interface BannerRow {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  title_color?: string | null;
  subtitle_color?: string | null;
  accent_color?: string | null;
  font_family?: Banner['fontFamily'] | null;
  sort_order: number;
  visible: boolean;
}
interface OrderRow {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  items: OrderItem[] | null;
  total: number | string;
  negotiated_total?: number | string | null;
  commission_base?: number | string | null;
  delivery_fee?: number | string | null;
  commission?: number | string | null;
  manager_name?: string | null;
  status: string;
  created_at: string;
}

export const mapProduct = (r: ProductRow): Product => {
  const stored = Array.isArray(r.image_urls) ? r.image_urls.filter((url) => typeof url === 'string' && url.length > 0) : [];
  // Productos creados antes de las fotos múltiples: la portada vive en `image_url`.
  const imageUrls = stored.length ? stored : r.image_url ? [r.image_url] : [];
  return {
    id: r.id,
    name: r.name,
    price: Number(r.price),
    managerPrice: r.manager_price == null ? Number(r.price) : Number(r.manager_price),
    stock: r.stock,
    description: r.description ?? '',
    imageUrl: imageUrls[0] ?? '',
    imageUrls,
    visible: r.visible,
    categoryId: r.category_id ?? null,
  };
};

export const mapCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  imageUrl: r.image_url ?? '',
  parentId: r.parent_id,
  sortOrder: r.sort_order,
  visible: r.visible,
});

export const mapProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  name: r.name ?? '',
  phone: r.phone ?? '',
  role: (r.role === 'admin' || r.role === 'manager' ? r.role : 'customer') as Role,
});

export const mapSettings = (r: SettingsRow): Settings => ({
  storeName: r.store_name,
  whatsapp: r.whatsapp,
  currency: r.currency,
});

export const mapBanner = (r: BannerRow): Banner => ({
  id: r.id,
  imageUrl: r.image_url,
  title: r.title,
  subtitle: r.subtitle,
  titleColor: r.title_color ?? '#ffffff',
  subtitleColor: r.subtitle_color ?? '#a9bdd8',
  accentColor: r.accent_color ?? '#00d5f5',
  fontFamily: r.font_family ?? 'display',
  sortOrder: r.sort_order,
  visible: r.visible,
});

export const mapOrder = (r: OrderRow): Order => ({
  id: r.id,
  customerName: r.customer_name,
  phone: r.phone,
  address: r.address,
  notes: r.notes ?? '',
  items: Array.isArray(r.items) ? r.items : [],
  total: Number(r.total),
  negotiatedTotal: r.negotiated_total == null ? null : Number(r.negotiated_total),
  commissionBase: r.commission_base == null ? null : Number(r.commission_base),
  deliveryFee: r.delivery_fee == null ? null : Number(r.delivery_fee),
  commission: r.commission == null ? null : Number(r.commission),
  managerName: r.manager_name ?? null,
  status: r.status as OrderStatus,
  createdAt: r.created_at,
});

export type { ProductRow, CategoryRow, ProfileRow, SettingsRow, BannerRow, OrderRow };
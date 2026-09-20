import type { Banner, Category, Order, OrderItem, OrderStatus, Product, Profile, Role, Settings } from './types';

/* Filas tal como vienen de la base de datos (snake_case) */
interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  stock: number | null;
  description: string | null;
  image_url: string | null;
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
  status: string;
  created_at: string;
}

export const mapProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  stock: r.stock,
  description: r.description ?? '',
  imageUrl: r.image_url ?? '',
  visible: r.visible,
  categoryId: r.category_id ?? null,
});

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
  role: (r.role === 'admin' ? 'admin' : 'customer') as Role,
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
  status: r.status as OrderStatus,
  createdAt: r.created_at,
});

export type { ProductRow, CategoryRow, ProfileRow, SettingsRow, BannerRow, OrderRow };
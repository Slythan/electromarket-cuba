export type Role = 'admin' | 'manager' | 'customer';

export interface Settings {
  storeName: string;
  whatsapp: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  parentId: string | null;
  sortOrder: number;
  visible: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  managerPrice: number;
  /** null = sin límite de stock */
  stock: number | null;
  description: string;
  /** Portada del producto: siempre la primera de `imageUrls`. */
  imageUrl: string;
  /** Hasta `MAX_PRODUCT_IMAGES` fotos (la primera es la portada). */
  imageUrls: string[];
  visible: boolean;
  categoryId?: string | null;
}

/** Fotos permitidas por producto (coincide con el `check` de supabase_products.sql). */
export const MAX_PRODUCT_IMAGES = 3;

/** Municipio de La Habana con el precio de mensajería definido por la tienda. */
export interface DeliveryZone {
  id: string;
  municipality: string;
  price: number;
  sortOrder: number;
  visible: boolean;
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface ManagerRequest {
  id: string;
  userId: string;
  name: string;
  phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  negotiatedPrice?: number;
}

export const ORDER_STATUSES = ['creada', 'confirmada', 'enviada', 'cobrada'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItem[];
  /** Precio pactado con el cliente (lo que paga). */
  total: number;
  /** Igual que `total`: precio pactado (se conserva por compatibilidad). */
  negotiatedTotal?: number | null;
  /** Lo que le costó el pedido al gestor (suma de precios de gestor). */
  managerCost?: number | null;
  /** Margen bruto: precio pactado − costo del gestor. */
  commissionBase?: number | null;
  deliveryFee?: number | null;
  /** Lo que cobra el gestor: margen bruto − mensajería. */
  commission?: number | null;
  managerName?: string | null;
  /** Municipio al que se entrega y que fijó el precio de mensajería. */
  deliveryZone?: string | null;
  status: OrderStatus;
  createdAt: string;
}

export interface CartLine {
  id: string;
  qty: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  notes: string;
  negotiatedTotal?: number;
  deliveryFee?: number;
  /** Municipio elegido por el gestor (deja constancia del precio aplicado). */
  deliveryZone?: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  titleColor: string;
  subtitleColor: string;
  accentColor: string;
  fontFamily: 'display' | 'clean' | 'mono';
  sortOrder: number;
  visible: boolean;
}

/**
 * El administrador atiende la tienda igual que un gestor, así que también
 * compra y vende con la tarifa de gestor.
 */
export const hasManagerPricing = (role: Role | undefined): boolean => role === 'manager' || role === 'admin';

export const priceForRole = (product: Product, role: Role | undefined): number =>
  hasManagerPricing(role) ? product.managerPrice : product.price;
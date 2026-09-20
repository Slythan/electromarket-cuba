export type Role = 'admin' | 'customer';

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
  /** null = sin límite de stock */
  stock: number | null;
  description: string;
  imageUrl: string;
  visible: boolean;
  categoryId?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export const ORDER_STATUSES = ['nuevo', 'confirmado', 'entregado', 'cancelado'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItem[];
  total: number;
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
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  visible: boolean;
}
import type { Category, Product } from './types';

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

export function categoryPath(category: Pick<Category, 'id' | 'name'>): string {
  return `/categorias/${slugify(category.name)}-${category.id}`;
}

export function productPath(product: Pick<Product, 'id' | 'name'>): string {
  return `/productos/${slugify(product.name)}-${product.id}`;
}

export function routeEntityId(segment: string): string {
  const match = segment.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  return match?.[1] ?? segment;
}
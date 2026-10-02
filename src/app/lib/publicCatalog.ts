import { unstable_cache } from 'next/cache';
import { fetchCategories } from '@/services/categories';
import { fetchProducts } from '@/services/products';

export const fetchPublicProducts = unstable_cache(
  async () => (await fetchProducts()).filter((product) => product.visible),
  ['public-catalog-products'],
  { revalidate: 300, tags: ['public-catalog-products'] }
);

export const fetchPublicCategories = unstable_cache(
  async () => fetchCategories(),
  ['public-catalog-categories'],
  { revalidate: 300, tags: ['public-catalog-categories'] }
);
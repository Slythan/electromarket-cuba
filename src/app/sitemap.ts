import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { ARTICLES } from '@/lib/articles';
import { fetchPublishedGuides } from '@/services/guides';
import { fetchProducts } from '@/services/products';
import { fetchCategories } from '@/services/categories';

export const dynamic = 'force-dynamic'; // El sitemap siempre refleja el catálogo y las guías actuales.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/privacy',
    '/terms',
    '/guias',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.5,
  }));

  let articleRoutes: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${baseUrl}/guias/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  try {
    const remoteGuides = await fetchPublishedGuides();
    articleRoutes = [
      ...remoteGuides.map((g) => ({
        url: `${baseUrl}/guias/${g.slug}`,
        lastModified: new Date(g.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
      ...articleRoutes,
    ];
  } catch {
    // Si Supabase no responde, el sitemap incluye al menos las guías estáticas.
  }

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await fetchCategories();
    categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/categorias/${cat.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    // Si Supabase no responde en build, el sitemap sigue generándose con el resto de rutas.
  }

  try {
    const products = await fetchProducts();
    productRoutes = products
      .filter((prod) => prod.visible)
      .map((prod) => ({
        url: `${baseUrl}/productos/${prod.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
  } catch {
    // Igual que arriba: no romper el build por un fallo de red.
  }

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...productRoutes];
}

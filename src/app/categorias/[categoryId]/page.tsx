import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { baseMetadata, toMetaDescription, SITE_URL } from '@/lib/seo';
import { categoryPath, productPath, routeEntityId } from '@/lib/slugs';
import { fetchPublicCategories, fetchPublicProducts } from '@/lib/publicCatalog';
import CategoryDetail from './CategoryDetail';

type Props = {
  params: Promise<{ categoryId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const categories = await fetchPublicCategories();
  const category = categories.find((c) => c.id === routeEntityId(categoryId));

  if (!category) return { ...baseMetadata, robots: { index: false, follow: true } };

  const description = toMetaDescription(`Compra ${category.name} en La Habana y Cuba. Explora productos seleccionados por ElectroMarketCuba con entrega y asesoría local.`);

  return {
    ...baseMetadata,
    title: `${category.name} en Cuba`,
    description,
    openGraph: {
      ...baseMetadata.openGraph,
      title: `${category.name} en Cuba`,
      description,
      url: `${SITE_URL}${categoryPath(category)}`,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
    },
    alternates: { canonical: categoryPath(category) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params;
  const [categories, products] = await Promise.all([fetchPublicCategories(), fetchPublicProducts()]);
  const category = categories.find((c) => c.id === routeEntityId(categoryId));

  if (!category) notFound();

  const canonicalPath = categoryPath(category);
  if (categoryId !== canonicalPath.split('/').at(-1)) redirect(canonicalPath);
  const categoryIds = new Set([category.id, ...categories.filter((item) => item.parentId === category.id).map((item) => item.id)]);
  const categoryProducts = products.filter((product) => categoryIds.has(product.categoryId ?? ''));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': category.name,
    'description': toMetaDescription(`Compra ${category.name} en La Habana y Cuba con ElectroMarketCuba. Productos seleccionados, entrega y asesoría local.`),
    'url': `${SITE_URL}${canonicalPath}`,
    ...(categoryProducts.length > 0 ? {
      'mainEntity': {
        '@type': 'ItemList',
        'numberOfItems': categoryProducts.length,
        'itemListElement': categoryProducts.map((product, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': 'Product',
            'name': product.name,
            'url': `${SITE_URL}${productPath(product)}`,
          },
        })),
      },
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryDetail initialCategories={categories} initialCategory={category} initialProducts={products} />
    </>
  );
}
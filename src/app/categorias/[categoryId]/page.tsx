import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchCategories } from '@/services/categories';
import { baseMetadata, toMetaDescription, SITE_URL } from '@/lib/seo';
import { categoryPath, routeEntityId } from '@/lib/slugs';
import CategoryDetail from './CategoryDetail';

type Props = {
  params: Promise<{ categoryId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const categories = await fetchCategories();
  const category = categories.find((c) => c.id === routeEntityId(categoryId));

  if (!category) return baseMetadata;

  const description = toMetaDescription(`Explora nuestra selección de ${category.name} en ElectroMarketCuba: tecnología, energía solar y movilidad eléctrica con entrega en Cuba.`);

  return {
    ...baseMetadata,
    title: category.name,
    description,
    openGraph: {
      ...baseMetadata.openGraph,
      title: category.name,
      description,
      url: `${SITE_URL}${categoryPath(category)}`,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
    },
    alternates: { canonical: categoryPath(category) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params;
  const categories = await fetchCategories();
  const category = categories.find((c) => c.id === routeEntityId(categoryId));

  if (!category) {
    return (
      <div className="container category-page">
        <h1>Categoría no encontrada</h1>
        <p className="muted">La categoría solicitada no existe.</p>
      </div>
    );
  }

  const canonicalPath = categoryPath(category);
  if (categoryId !== canonicalPath.split('/').at(-1)) redirect(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': category.name,
    'description': `Explora nuestra selección de ${category.name} en ElectroMarketCuba.`,
    'url': `${SITE_URL}${canonicalPath}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryDetail initialCategories={categories} initialCategory={category} />
    </>
  );
}
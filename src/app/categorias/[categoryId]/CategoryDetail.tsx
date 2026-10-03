'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { useStore } from '@/context/StoreContext';
import type { Category } from '@/lib/types';
import { categoryPath } from '@/lib/slugs';
import type { PublicProductPage } from '@/services/products';

export default function CategoryDetail({ initialCategories, initialCategory, initialPages }: { initialCategories: Category[]; initialCategory: Category; initialPages: Record<string, PublicProductPage> }) {
  const { categories: storeCategories } = useStore();
  const categories = storeCategories.length ? storeCategories : initialCategories;
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const category = categories.find((item) => item.id === initialCategory.id) ?? initialCategory;
  const children = categories.filter((item) => item.parentId === category?.id);

  if (!category) {
    return <div className="container category-page"><h1>Categoría no encontrada</h1><Link href="/" className="btn">Volver a la tienda</Link></div>;
  }

  return (
    <div className="container category-page">
      <Link href="/" className="legal-page__back">← Volver a la tienda</Link>
      <header className="category-page__header">
        <div className="category-page__image">{category.imageUrl ? <Image src={category.imageUrl} alt={category.name} fill sizes="112px" unoptimized loading="lazy" decoding="async" /> : <span aria-hidden="true">◈</span>}</div>
        <div>
          <span className="eyebrow">CATEGORÍA</span>
          <h1>{category.name}</h1>
          {children.length > 0 && <p className="muted">Incluye: {children.map((child) => child.name).join(', ')}</p>}
        </div>
      </header>
      <div className="category-page__tools"><div><span className="eyebrow">CATÁLOGO</span><h2>Productos de {category.name}</h2></div></div>
      {children.length > 0 ? (
        <div className="subcategory-sections">
          {children.map((child) => (
            <section className="subcategory-section" key={child.id}>
              <div className="subcategory-section__heading">
                <Link className="subcategory-section__identity" href={categoryPath(child)}>
                  <div className="subcategory-section__image">{child.imageUrl ? <Image src={child.imageUrl} alt={child.name} fill sizes="58px" unoptimized loading="lazy" decoding="async" /> : <span aria-hidden="true">◈</span>}</div>
                  <div><span className="eyebrow">SUBCATEGORÍA</span><h2>{child.name}</h2></div>
                </Link>
                <Link className="subcategory-section__link" href={categoryPath(child)}>Ver toda la sección →</Link>
              </div>
              <ProductGrid query={query} categoryId={child.id} categories={categories} initialProducts={initialPages[child.id]?.products ?? []} initialHasMore={initialPages[child.id]?.hasMore ?? false} includeChildren={false} />
            </section>
          ))}
          <section className="subcategory-section subcategory-section--direct">
            <div className="subcategory-section__heading"><div><span className="eyebrow">CATEGORÍA PRINCIPAL</span><h2>Otros productos de {category.name}</h2></div></div>
            <ProductGrid query={query} categoryId={category.id} categories={categories} initialProducts={initialPages[category.id]?.products ?? []} initialHasMore={initialPages[category.id]?.hasMore ?? false} includeChildren={false} />
          </section>
        </div>
      ) : (
        <ProductGrid query={query} categoryId={category.id} categories={categories} initialProducts={initialPages[category.id]?.products ?? []} initialHasMore={initialPages[category.id]?.hasMore ?? false} includeChildren={false} />
      )}
    </div>
  );
}

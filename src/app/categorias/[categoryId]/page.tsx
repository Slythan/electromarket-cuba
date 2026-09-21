'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { useStore } from '@/context/StoreContext';

export default function CategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const { categories, loading } = useStore();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const category = categories.find((item) => item.id === params.categoryId);
  const children = categories.filter((item) => item.parentId === category?.id);

  if (loading) return <div className="container category-page"><p className="muted">Cargando categoría…</p></div>;

  if (!category) {
    return <div className="container category-page"><h1>Categoría no encontrada</h1><Link href="/" className="btn">Volver a la tienda</Link></div>;
  }

  return (
    <div className="container category-page">
      <Link href="/" className="legal-page__back">← Volver a la tienda</Link>
      <header className="category-page__header">
        <div className="category-page__image">{category.imageUrl ? <img src={category.imageUrl} alt={category.name} /> : <span aria-hidden="true">◈</span>}</div>
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
                <Link className="subcategory-section__identity" href={`/categorias/${child.id}`}>
                  <div className="subcategory-section__image">{child.imageUrl ? <img src={child.imageUrl} alt={child.name} /> : <span aria-hidden="true">◈</span>}</div>
                  <div><span className="eyebrow">SUBCATEGORÍA</span><h2>{child.name}</h2></div>
                </Link>
                <Link className="subcategory-section__link" href={`/categorias/${child.id}`}>Ver toda la sección →</Link>
              </div>
              <ProductGrid query={query} categoryId={child.id} categories={categories} includeChildren={false} />
            </section>
          ))}
          <section className="subcategory-section subcategory-section--direct">
            <div className="subcategory-section__heading"><div><span className="eyebrow">CATEGORÍA PRINCIPAL</span><h2>Otros productos de {category.name}</h2></div></div>
            <ProductGrid query={query} categoryId={category.id} categories={categories} includeChildren={false} />
          </section>
        </div>
      ) : (
        <ProductGrid query={query} categoryId={category.id} categories={categories} includeChildren={false} />
      )}
    </div>
  );
}
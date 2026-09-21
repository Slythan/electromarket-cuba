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
      <ProductGrid query={query} categoryId={category.id} categories={categories} />
    </div>
  );
}
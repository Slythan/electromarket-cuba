'use client';

import { useMemo } from 'react';
import type { Category } from '@/lib/types';

export default function CategoryShowcase({ categories }: { categories: Category[] }) {
  const parents = useMemo(() => categories.filter((category) => !category.parentId), [categories]);
  if (!parents.length) return null;

  return (
    <section className="category-showcase" aria-label="Categorías">
      <div className="section-heading"><div><span className="eyebrow">EXPLORA LA TIENDA</span><h2>Encuentra lo que necesitas</h2></div></div>
      <div className="category-grid">
        {parents.map((parent) => {
          const children = categories.filter((category) => category.parentId === parent.id);
          return (
            <article className="category-card" key={parent.id}>
              <div className="category-card__image">{parent.imageUrl ? <img src={parent.imageUrl} alt={parent.name} /> : <span aria-hidden="true">◈</span>}</div>
              <div className="category-card__body"><h3>{parent.name}</h3>{children.length > 0 && <div className="subcategory-list">{children.map((child) => <span key={child.id}>{child.name}</span>)}</div>}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

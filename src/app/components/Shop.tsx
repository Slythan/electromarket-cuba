'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import ProductGrid from './ProductGrid';
import HeroCarousel from './HeroCarousel';
import CategoryShowcase from './CategoryShowcase';

export default function Shop() {
  const { settings, banners, categories } = useStore();
  const [query, setQuery] = useState('');

  return (
    <div className="container">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">TECNOLOGIA · ENERGIA · MOVILIDAD</span>
          <h1>{settings.storeName}</h1>
          <p>Soluciones confiables para tu día a día, seleccionadas para Cuba.</p>
        </div>
        <div className="hero__mark" aria-hidden="true">⚡</div>
      </section>

      <HeroCarousel banners={banners} />

      <CategoryShowcase categories={categories} />

      <div className="searchbar">
        <span className="searchbar__icon" aria-hidden="true">⌕</span>
        <input
          className="input"
          type="search"
          placeholder="Buscar productos…"
          aria-label="Buscar productos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ProductGrid query={query} />
    </div>
  );
}
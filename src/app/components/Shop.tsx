'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import ProductGrid from './ProductGrid';
import HeroCarousel from './HeroCarousel';
import CategoryShowcase from './CategoryShowcase';
import CategoryDropdown from './CategoryDropdown';
import StoreHighlights from './StoreHighlights';

export default function Shop() {
  const { settings, banners, categories } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const categoryId = searchParams.get('category') ?? '';

  const selectCategory = (nextCategoryId: string) => {
    router.push(nextCategoryId ? `/?category=${nextCategoryId}#catalogo` : '/#catalogo');
  };

  return (
    <div className="container">
      <section className="hero hero--storefront">
        <div className="hero__copy">
          <span className="eyebrow">TECNOLOGIA · ENERGIA · MOVILIDAD</span>
          <h1>{settings.storeName}</h1>
          <p>Soluciones de energía, tecnología y movilidad seleccionadas para la vida diaria en Cuba.</p>
          <div className="hero__actions"><a className="btn" href="#catalogo">Ver productos　→</a><a className="btn btn--light" href="#categorias">Explorar categorías　→</a></div>
        </div>
        <div className="hero__mark" aria-hidden="true">⚡</div>
      </section>

      <HeroCarousel banners={banners} />

      <div id="categorias"><CategoryShowcase categories={categories} activeCategoryId={categoryId} /></div>

      <div className="catalog-tools">
        <CategoryDropdown categories={categories} value={categoryId} onChange={selectCategory} />
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
      </div>

      <section id="catalogo" className="catalog-section"><div className="catalog-section__heading"><div><span className="eyebrow">SELECCIÓN ELECTROMARKET</span><h2>Productos destacados</h2></div><span className="catalog-section__arrow">Ver destacados　→</span></div><ProductGrid query={query} categoryId={categoryId} categories={categories} /></section>
      {categories.length === 0 && <div className="empty storefront-empty">El catálogo se está preparando. Pronto tendremos productos disponibles.</div>}
      <StoreHighlights />
      <section className="about-band"><div className="about-band__visual"><img src="/about-electromarket.png" alt="ElectroMarket, compromiso y calidad en productos electrónicos" /></div><div><span className="eyebrow">COMPRA CON CONFIANZA</span><h2>Tecnología que mejora la vida en Cuba</h2><p>En ElectroMarket seleccionamos productos útiles, duraderos y adaptados a tus necesidades. Nuestro equipo te acompaña con información clara y soporte humano.</p><div className="about-stats"><strong>+2 500<small>clientes</small></strong><strong>100%<small>compra segura</small></strong><strong>Soporte<small>local</small></strong></div></div></section>
    </div>
  );
}
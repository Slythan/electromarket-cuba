'use client';

import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import ProductGrid from './ProductGrid';
import HeroCarousel from './HeroCarousel';
import CategoryShowcase from './CategoryShowcase';
import StoreHighlights from './StoreHighlights';
import type { Category, Product } from '@/lib/types';

export default function Shop({ initialProducts, initialHasMore, initialCategories }: { initialProducts: Product[]; initialHasMore: boolean; initialCategories: Category[] }) {
  const { settings, banners, categories: storeCategories, loading } = useStore();
  const categories = loading ? initialCategories : storeCategories;
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

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

      <div id="categorias"><CategoryShowcase categories={categories} /></div>

      <section id="catalogo" className="catalog-section"><div className="catalog-section__heading"><div><span className="eyebrow">Selección ElectroMarketCuba</span><h2>Productos destacados</h2></div><span className="catalog-section__arrow">Ver destacados　→</span></div><ProductGrid query={query} initialProducts={initialProducts} initialHasMore={initialHasMore} /></section>
      {categories.length === 0 && <div className="empty storefront-empty">El catálogo se está preparando. Pronto tendremos productos disponibles.</div>}
      <StoreHighlights />
      <section className="about-band"><div className="about-band__visual"><Image src="/about-electromarket.png" alt="ElectroMarketCuba, compromiso y calidad en productos electrónicos" fill sizes="(max-width: 760px) 100vw, 45vw" unoptimized loading="lazy" decoding="async" /></div><div><span className="eyebrow">COMPRA CON CONFIANZA</span><h2>Tecnología que mejora la vida en Cuba</h2><p>En ElectroMarketCuba seleccionamos productos útiles, duraderos y adaptados a tus necesidades. Nuestro equipo te acompaña con información clara y soporte humano.</p><div className="about-stats"><strong>+2 500<small>clientes</small></strong><strong>100%<small>compra segura</small></strong><strong>Soporte<small>local</small></strong></div></div></section>
    </div>
  );
}
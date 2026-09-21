'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { Banner } from '@/lib/types';

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= banners.length) setActive(0);
  }, [active, banners.length]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section className="hero-carousel" aria-label="Promociones destacadas">
      <div className="hero-carousel__track" style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}>
        {banners.map((banner) => {
          const fontFamily = banner.fontFamily === 'mono' ? 'ui-monospace, SFMono-Regular, Consolas, monospace' : banner.fontFamily === 'clean' ? "'Avenir Next', Avenir, 'Segoe UI', sans-serif" : "'Arial Black', 'Avenir Next', Avenir, sans-serif";
          return (
            <div className="hero-carousel__slide" key={banner.id} style={{ '--banner-title': banner.titleColor, '--banner-subtitle': banner.subtitleColor, '--banner-accent': banner.accentColor, '--banner-font': fontFamily } as CSSProperties}>
              <div className="hero-carousel__image-wrap">
                <img className="hero-carousel__image" src={banner.imageUrl} alt={banner.title || 'Promoción ElectroMarket'} />
              </div>
              {(banner.title || banner.subtitle) && (
                <div className="hero-carousel__copy">
                  <span className="hero-carousel__label">ElectroMarket · selección</span>
                  {banner.title && <h2>{banner.title}</h2>}
                  {banner.subtitle && <p>{banner.subtitle}</p>}
                  <span className="hero-carousel__line" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="hero-carousel__controls">
          <button type="button" aria-label="Banner anterior" onClick={() => setActive((active - 1 + banners.length) % banners.length)}>‹</button>
          <div className="hero-carousel__dots">
            {banners.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === active ? 'is-active' : ''}
                aria-label={`Ir al banner ${index + 1}`}
                aria-current={index === active ? 'true' : undefined}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
          <button type="button" aria-label="Banner siguiente" onClick={() => setActive((active + 1) % banners.length)}>›</button>
        </div>
      )}
    </section>
  );
}

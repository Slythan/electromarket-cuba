'use client';

import { useEffect, useState } from 'react';
import type { Banner } from '@/lib/types';

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= banners.length) setActive(0);
  }, [active, banners.length]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 5500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  const banner = banners[active];
  return (
    <section className="hero-carousel" aria-label="Promociones destacadas">
      <div className="hero-carousel__image-wrap">
        <img className="hero-carousel__image" src={banner.imageUrl} alt={banner.title || 'Promoción ElectroMarket'} />
      </div>
      {(banner.title || banner.subtitle) && (
        <div className="hero-carousel__copy">
          {banner.title && <h2>{banner.title}</h2>}
          {banner.subtitle && <p>{banner.subtitle}</p>}
        </div>
      )}
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES } from '@/lib/articles';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Guías y consejos',
  description:
    'Guías prácticas sobre energía solar, estaciones de energía, movilidad eléctrica y tecnología en Cuba. Aprende a elegir bien antes de comprar.',
  alternates: { canonical: `${SITE_URL}/guias` },
};

export default function GuiasPage() {
  return (
    <div className="container legal-page">
      <Link className="legal-page__back" href="/">← Volver a la tienda</Link>
      <span className="eyebrow">ELECTROMARKET · APRENDE</span>
      <h1>Guías y consejos</h1>
      <p className="legal-page__lead">
        Análisis prácticos para elegir bien: energía solar, estaciones de energía, movilidad eléctrica y tecnología para la vida en Cuba.
      </p>

      <div className="guides-grid">
        {ARTICLES.map((article) => (
          <Link key={article.slug} href={`/guias/${article.slug}`} className="guide-card">
            <span className="guide-card__tag">{article.tag}</span>
            <h2>{article.title}</h2>
            <p className="muted">{article.excerpt}</p>
            <span className="guide-card__meta">
              {new Date(article.date).toLocaleDateString('es-CU', { day: 'numeric', month: 'long', year: 'numeric' })} · {article.readingTime} de lectura
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

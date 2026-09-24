import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES, type Article } from '@/lib/articles';
import { fetchPublishedGuides } from '@/services/guides';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic'; // Siempre fresco: las guías nuevas del panel salen al instante.

export const metadata: Metadata = {
  title: 'Guías y consejos',
  description:
    'Guías prácticas sobre energía solar, estaciones de energía, movilidad eléctrica y tecnología en Cuba. Aprende a elegir bien antes de comprar.',
  alternates: { canonical: `${SITE_URL}/guias` },
};

export default async function GuiasPage() {
  // Guías del panel (Supabase); si falla o está vacío, se muestran las estáticas.
  let articles: Article[] = ARTICLES;
  try {
    const remote = await fetchPublishedGuides();
    if (remote.length) articles = [...remote, ...ARTICLES];
  } catch {
    // Respaldo silencioso con el contenido estático.
  }

  return (
    <div className="container legal-page">
      <Link className="legal-page__back" href="/">← Volver a la tienda</Link>
      <span className="eyebrow">ELECTROMARKET · APRENDE</span>
      <h1>Guías y consejos</h1>
      <p className="legal-page__lead">
        Análisis prácticos para elegir bien: energía solar, estaciones de energía, movilidad eléctrica y tecnología para la vida en Cuba.
      </p>

      <div className="guides-grid">
        {articles.map((article) => (
          <Link key={article.slug} href={`/guias/${article.slug}`} className="guide-card">
            {article.coverImage && <img src={article.coverImage} alt={article.title} className="guide-card__cover" />}
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

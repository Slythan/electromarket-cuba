import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ARTICLES, getArticle, type Article, type ArticleBlock } from '@/lib/articles';
import { fetchPublishedGuide, fetchPublishedGuides } from '@/services/guides';
import { SITE_NAME, SITE_URL, toMetaDescription } from '@/lib/seo';

export const revalidate = 300; // Se regenera cada 5 min con los cambios del panel.

type Props = { params: Promise<{ slug: string }> };

/** Busca primero en Supabase (guías del panel) y luego en las estáticas. */
async function resolveArticle(slug: string): Promise<Article | null> {
  try {
    const remote = await fetchPublishedGuide(slug);
    if (remote) return remote;
  } catch {
    // Respaldo con el contenido estático.
  }
  return getArticle(slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await resolveArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: toMetaDescription(article.excerpt),
    alternates: { canonical: `${SITE_URL}/guias/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: toMetaDescription(article.excerpt),
      url: `${SITE_URL}/guias/${article.slug}`,
      publishedTime: article.date,
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
  };
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>;
    case 'p':
      return <p>{block.text}</p>;
    case 'ul':
      return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    case 'img':
      return <figure className="guide-figure"><img src={block.src} alt={block.alt} loading="lazy" /></figure>;
    case 'cta':
      return <p className="guide-cta"><Link className="btn btn--primary" href={block.href}>{block.label}</Link></p>;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await resolveArticle(slug);
  if (!article) notFound();

  let related: Article[] = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);
  try {
    const remote = await fetchPublishedGuides();
    related = [...remote, ...ARTICLES].filter((a) => a.slug !== article.slug).slice(0, 2);
  } catch {
    // Se quedan las estáticas.
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.excerpt,
    'datePublished': article.date,
    'image': article.coverImage ?? undefined,
    'author': { '@type': 'Organization', 'name': SITE_NAME, 'url': SITE_URL },
    'publisher': { '@type': 'Organization', 'name': SITE_NAME, 'url': SITE_URL },
    'mainEntityOfPage': `${SITE_URL}/guias/${article.slug}`,
  };

  return (
    <div className="container legal-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link className="legal-page__back" href="/guias">← Todas las guías</Link>
      <span className="eyebrow">{article.tag.toUpperCase()} · {article.readingTime.toUpperCase()}</span>
      <h1>{article.title}</h1>
      <p className="legal-page__lead">
        {new Date(article.date).toLocaleDateString('es-CU', { day: 'numeric', month: 'long', year: 'numeric' })} · Por el equipo de {SITE_NAME}
      </p>

      {article.coverImage && <img src={article.coverImage} alt={article.title} className="guide-hero" />}

      {article.blocks.map((block, i) => <Block key={i} block={block} />)}

      {related.length > 0 && (
        <section className="guide-related">
          <h2>Sigue aprendiendo</h2>
          <div className="guides-grid">
            {related.map((item) => (
              <Link key={item.slug} href={`/guias/${item.slug}`} className="guide-card">
                <span className="guide-card__tag">{item.tag}</span>
                <h2>{item.title}</h2>
                <span className="guide-card__meta">{item.readingTime} de lectura</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

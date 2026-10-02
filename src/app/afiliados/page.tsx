import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GuideContent from '@/components/GuideContent';
import { AFFILIATE_GUIDE_SLUG } from '@/lib/guideRoutes';
import { fetchPublishedGuide } from '@/services/guides';
import { SITE_NAME, SITE_URL, toMetaDescription } from '@/lib/seo';

export const dynamic = 'force-dynamic';

async function getAffiliateGuide() {
  try {
    return await fetchPublishedGuide(AFFILIATE_GUIDE_SLUG);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const article = await getAffiliateGuide();
  const canonical = `${SITE_URL}/afiliados`;
  if (!article) {
    return {
      title: 'Programa de afiliados',
      description: 'Conoce el programa de afiliados de ElectroMarketCuba.',
      alternates: { canonical },
    };
  }

  const description = toMetaDescription(article.excerpt);
  return {
    title: article.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: canonical,
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
  };
}

export default async function AffiliatesPage() {
  const article = await getAffiliateGuide();
  if (!article) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    image: article.coverImage ?? undefined,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/afiliados`,
  };

  return (
    <div className="container legal-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link className="legal-page__back" href="/">← Volver a la tienda</Link>
      <span className="eyebrow">ElectroMarketCuba · Afiliados</span>
      <h1>{article.title}</h1>
      <p className="legal-page__lead">{article.excerpt}</p>
      {article.coverImage && <img src={article.coverImage} alt={article.title} className="guide-hero" />}
      <GuideContent blocks={article.blocks} />
    </div>
  );
}
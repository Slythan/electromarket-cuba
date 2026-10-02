import type { Metadata, Viewport } from 'next';
import { Suspense, type ReactNode } from 'react';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { baseMetadata, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/seo';

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        'name': SITE_NAME,
        'url': SITE_URL,
        'description': SITE_DESCRIPTION,
        'logo': `${SITE_URL}/icon.svg`,
        'areaServed': [
          { '@type': 'City', 'name': 'La Habana' },
          { '@type': 'Country', 'name': 'Cuba' },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        'name': SITE_NAME,
        'url': SITE_URL,
        'publisher': { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body>
        <Providers>
          <Suspense fallback={null}><Header /></Suspense>
          <main>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
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
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': SITE_NAME,
    'url': SITE_URL,
    'description': SITE_DESCRIPTION,
    'logo': `${SITE_URL}/icon.svg`,
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
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
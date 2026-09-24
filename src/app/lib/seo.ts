import type { Metadata } from 'next';

/** URL pública del sitio (configúrala en .env.local como NEXT_PUBLIC_SITE_URL). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://electromarket-cuba.vercel.app';

export const SITE_NAME = 'ElectroMarketCuba';

export const SITE_DESCRIPTION =
  'Tienda online de tecnología, energía solar,estaciones de energía y movilidad eléctrica en Cuba. ' +
  'Compra electrodomésticos, paneles solares, bicicletas eléctricas,estaciones de energía Ecoflow,Oukitel PEcrón y más, con entrega en La Habana.';

export const SITE_KEYWORDS = [
  'comprar tecnología en La Habana',
  'tienda online La Habana',
  'electrodomésticos La Habana',
  'paneles solares La Habana',
  'energía solar La Habana',
  'movilidad eléctrica La Habana',
  'bicicletas eléctricas Habana',
  'comprar en La Habana',
  'envíos a domicilio Cuba',
  'estaciones de Energia en la Habana',
  'Ecoflow en la Habana',
  'Laptops y Móviles en la Habana',
  'Celulares en la Habana',
  'Televisores en la Habana',
  'Oukitel en la Habana',
  'Tienda de tecnología en La Habana',
  'Tienda de tecnología en La Habana',
  'Tienda de tecnología en Cuba',
  'Pecrón en la Habana',
  'ElectroMarketCuba',
];

/** Metadata base compartida por todas las páginas. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Tecnología, energía y movilidad en Cuba`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'es_CU',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Tecnología, energía y movilidad en Cuba`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    google: 'YtV9XhydKOY-FDPAjX00shyq9zE4_h42XwCuKqxLH3Y',
  },
  alternates: { canonical: '/' },
  category: 'shopping',
};

/** Recorta un texto para usarlo como meta description (máx. ~160 caracteres). */
export function toMetaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

import type { Metadata } from 'next';

/** URL pública del sitio (configúrala en .env.local como NEXT_PUBLIC_SITE_URL). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://electromarket-cuba.vercel.app').replace(/\/+$/, '');

export const SITE_NAME = 'ElectroMarketCuba';

export function normalizeBrandText(value: string): string {
  const normalizeCopy = (text: string) => text
    .replace(/ElectroMarket\s+Cuba/gi, SITE_NAME)
    .replace(/\bElectroMarket\b(?!Cuba)/gi, SITE_NAME);
  const segments = value.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+|\/[^\s)]+)/g);

  return segments.map((segment) => {
    const markdownLink = segment.match(/^(!?)\[([^\]]+)\]\(([^)]+)\)$/);
    if (markdownLink) return `${markdownLink[1]}[${normalizeCopy(markdownLink[2])}](${markdownLink[3]})`;
    if (/^(https?:\/\/|\/)/i.test(segment)) return segment;
    return normalizeCopy(segment);
  }).join('');
}

export const SITE_DESCRIPTION =
  'ElectroMarketCuba: tienda online de tecnología, energía solar y movilidad eléctrica en Cuba. ' +
  'Estaciones de energía, asesoría y entregas en La Habana.';

export const SITE_KEYWORDS = [
  'ElectroMarketCuba',
  'tienda online de tecnología en Cuba',
  'tecnología en La Habana',
  'electrodomésticos en Cuba',
  'estaciones de energía en Cuba',
  'paneles solares en La Habana',
  'energía solar en Cuba',
  'movilidad eléctrica en Cuba',
  'bicicletas eléctricas en La Habana',
  'envíos a domicilio en Cuba',
  'EcoFlow en La Habana',
  'Oukitel en Cuba',
  'Pecron en Cuba',
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
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' }],
  },
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
  category: 'shopping',
};

/** Recorta un texto para usarlo como meta description (máx. ~160 caracteres). */
export function toMetaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'ElectroMarketCuba',
  description: 'Tecnología, energía y movilidad en Cuba.',
  applicationName: 'ElectroMarketCuba',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
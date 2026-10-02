import { Suspense } from 'react';
import Shop from '@/components/Shop';
import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <Suspense fallback={null}><Shop /></Suspense>;
}
import { Suspense } from 'react';
import Shop from '@/components/Shop';
import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';
import { fetchPublicCategories, fetchPublicProducts } from '@/lib/publicCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [initialProducts, initialCategories] = await Promise.all([
    fetchPublicProducts().catch(() => []),
    fetchPublicCategories().catch(() => []),
  ]);

  return <Suspense fallback={null}><Shop initialProducts={initialProducts} initialCategories={initialCategories} /></Suspense>;
}
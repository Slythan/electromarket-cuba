import { Suspense } from 'react';
import Shop from '@/components/Shop';
import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';
import { fetchPublicCategories, fetchPublicProductsPage } from '@/lib/publicCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [initialPage, initialCategories] = await Promise.all([
    fetchPublicProductsPage([], '', 0, 12).catch(() => ({ products: [], total: 0, hasMore: false })),
    fetchPublicCategories().catch(() => []),
  ]);

  return <Suspense fallback={null}><Shop initialProducts={initialPage.products} initialHasMore={initialPage.hasMore} initialCategories={initialCategories} /></Suspense>;
}
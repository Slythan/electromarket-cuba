import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchProduct } from '@/services/products';
import { baseMetadata, toMetaDescription, SITE_URL } from '@/lib/seo';
import { productPath } from '@/lib/slugs';
import { fetchSettings } from '@/services/settings';
import ProductDetail from './ProductDetail';

type Props = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await fetchProduct(productId);

  if (!product) return baseMetadata;

  const canonicalPath = productPath(product);
  const description = toMetaDescription(product.description || `Compra ${product.name} en La Habana y Cuba con entrega y asesoría de ElectroMarketCuba.`);

  return {
    ...baseMetadata,
    title: `${product.name} en Cuba`,
    description,
    openGraph: {
      ...baseMetadata.openGraph,
      title: `${product.name} en Cuba`,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      images: product.imageUrls.length > 0 ? [{ url: product.imageUrls[0] }] : [],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: `${product.name} en Cuba`,
      description,
      images: product.imageUrls.length > 0 ? [product.imageUrls[0]] : [],
    },
    alternates: { canonical: canonicalPath },
    robots: { index: product.visible, follow: true },
  };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const product = await fetchProduct(productId);

  if (!product) {
    return (
      <div className="container product-page">
        <h1>Producto no disponible</h1>
        <p className="muted">Este producto no existe o ya no está publicado.</p>
      </div>
    );
  }

  const canonicalPath = productPath(product);
  if (productId !== canonicalPath.split('/').at(-1)) redirect(canonicalPath);

  const currency = (await fetchSettings()).currency.trim().toUpperCase();
  const hasSchemaCurrency = /^[A-Z]{3}$/.test(currency);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.imageUrls.length > 0 ? product.imageUrls : [],
    'description': product.description,
    'sku': product.id,
    'offers': {
      '@type': 'Offer',
      'url': `${SITE_URL}${canonicalPath}`,
      ...(hasSchemaCurrency ? { priceCurrency: currency, price: product.price } : {}),
      'availability': product.stock === null || product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'itemCondition': 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail initialProduct={product} />
    </>
  );
}

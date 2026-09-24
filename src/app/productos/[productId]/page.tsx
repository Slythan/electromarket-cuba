import { Metadata } from 'next';
import { fetchProduct } from '@/services/products';
import { baseMetadata, toMetaDescription, SITE_URL } from '@/lib/seo';
import ProductDetail from './ProductDetail';

type Props = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await fetchProduct(productId);

  if (!product) return baseMetadata;

  return {
    ...baseMetadata,
    title: product.name,
    description: toMetaDescription(product.description),
    openGraph: {
      ...baseMetadata.openGraph,
      title: product.name,
      description: toMetaDescription(product.description),
      images: product.imageUrls.length > 0 ? [{ url: product.imageUrls[0] }] : [],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: product.name,
      description: toMetaDescription(product.description),
      images: product.imageUrls.length > 0 ? [product.imageUrls[0]] : [],
    },
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.imageUrls.length > 0 ? product.imageUrls : [],
    'description': product.description,
    'sku': product.id,
    'offers': {
      '@type': 'Offer',
      'url': `${SITE_URL}/productos/${product.id}`,
      'priceCurrency': 'USD', // Default, will be handled by store context in client
      'price': product.price,
      'availability': product.stock !== null && product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail />
    </>
  );
}

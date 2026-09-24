'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { fetchProduct } from '@/services/products';
import { formatMoney } from '@/lib/format';
import { hasManagerPricing, priceForRole, type Product } from '@/lib/types';
import ProductGrid from '@/components/ProductGrid';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';

export default function ProductDetail() {
  const params = useParams<{ productId: string }>();
  const { categories, products, settings, loading: storeLoading } = useStore();
  const { profile, isAdmin } = useAuth();
  const cart = useCart();
  const [loaded, setLoaded] = useState<{ id: string; product: Product | null } | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let active = true;
    fetchProduct(params.productId)
      .then((found) => {
        if (!active) return;
        setActivePhoto(0);
        setLoaded({ id: params.productId, product: found });
      })
      .catch(() => active && setLoaded({ id: params.productId, product: null }));
    return () => {
      active = false;
    };
  }, [params.productId]);

  const isLoading = loaded === null || loaded.id !== params.productId;
  const product = loaded && loaded.id === params.productId ? loaded.product : null;

  if (isLoading) {
    return <div className="container product-page"><p className="muted">Cargando producto…</p></div>;
  }

  if (!product || (!product.visible && !isAdmin)) {
    return (
      <div className="container product-page">
        <h1>Producto no disponible</h1>
        <p className="muted">Este producto no existe o ya no está publicado.</p>
        <Link href="/" className="btn">Volver a la tienda</Link>
      </div>
    );
  }

  const isManager = hasManagerPricing(profile?.role);
  const price = priceForRole(product, profile?.role);
  const category = categories.find((item) => item.id === product.categoryId);
  const parent = category?.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
  const photos = product.imageUrls.length ? product.imageUrls : [''];
  const active = Math.min(activePhoto, photos.length - 1);
  const qty = cart.qtyOf(product.id);
  const limited = product.stock !== null;
  const soldOut = limited && (product.stock ?? 0) <= 0;
  const commissionBase = Math.round((product.price - product.managerPrice) * 100) / 100;
  const canAdd = products.some((item) => item.id === product.id);
  const hasRelated = Boolean(category) && products.some((item) => item.visible && item.categoryId === category?.id && item.id !== product.id);

  return (
    <div className="container product-page">
      <Link href={category ? `/categorias/${category.id}` : '/'} className="legal-page__back">← Volver a {category ? category.name : 'la tienda'}</Link>

      <nav className="product-breadcrumb" aria-label="Ubicación del producto">
        <Link href="/">Tienda</Link>
        {parent && <><span aria-hidden="true">/</span><Link href={`/categorias/${parent.id}`}>{parent.name}</Link></>}
        {category && <><span aria-hidden="true">/</span><Link href={`/categorias/${category.id}`}>{category.name}</Link></>}
        <span aria-hidden="true">/</span>
        <span className="muted">{product.name}</span>
      </nav>

      <article className="product">
        <div className="product__gallery">
          <div className="product__photo">
            {photos[active] ? <img src={photos[active]} alt={product.name} /> : <span aria-hidden="true">📦</span>}
            {soldOut && <span className="card__tag">Agotado</span>}
          </div>
          {photos.length > 1 && (
            <div className="product__thumbs">
              {photos.map((url, index) => (
                <button
                  type="button"
                  key={url}
                  className={index === active ? 'is-active' : ''}
                  onClick={() => setActivePhoto(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={index === active ? 'true' : undefined}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product__info">
          <span className="eyebrow">{category ? category.name.toUpperCase() : 'PRODUCTO'}</span>
          <h1>{product.name}</h1>
          {!product.visible && <p className="warn">Producto oculto: solo lo ves tú como administrador.</p>}

          {isManager ? (
            <div className="product__prices">
              <div className="product__price">
                <small>Tu precio de gestor</small>
                <strong>{formatMoney(price, settings.currency)}</strong>
              </div>
              <div className="product__price product__price--client">
                <small>Precio cliente final</small>
                <strong>{formatMoney(product.price, settings.currency)}</strong>
              </div>
              <p className="note">
                Comisión base si vendes al precio de catálogo: <strong>{formatMoney(commissionBase, settings.currency)}</strong>.
                En el checkout negocias el precio final y puedes restar la mensajería.
              </p>
            </div>
          ) : (
            <div className="product__prices">
              <div className="product__price">
                <small>Precio</small>
                <strong>{formatMoney(price, settings.currency)}</strong>
              </div>
            </div>
          )}

          <p className="product__stock muted">
            {soldOut ? 'Agotado' : limited ? `${product.stock} disponibles` : 'Disponible · sin límite de stock'}
          </p>

          <div className="product__actions">
            {soldOut ? (
              <Button block disabled>Agotado</Button>
            ) : !canAdd ? (
              <Button block disabled>{storeLoading ? 'Cargando…' : 'Disponible en un momento'}</Button>
            ) : qty > 0 ? (
              <>
                <Stepper value={qty} onInc={() => cart.add(product.id)} onDec={() => cart.dec(product.id)} />
                <Button variant="link" className="danger-text" onClick={() => cart.remove(product.id)}>Quitar del carrito</Button>
              </>
            ) : (
              <Button block onClick={() => cart.add(product.id)}>Añadir al carrito</Button>
            )}
          </div>

          <section className="product__description">
            <h2>Descripción</h2>
            <p>{product.description || 'Este producto todavía no tiene descripción.'}</p>
          </section>
        </div>
      </article>

      {category && hasRelated && (
        <section className="product-related">
          <div className="section-heading">
            <div><span className="eyebrow">TAMBIÉN TE PUEDE INTERESAR</span><h2>Más de {category.name}</h2></div>
            <Link className="subcategory-section__link" href={`/categorias/${category.id}`}>Ver toda la categoría →</Link>
          </div>
          <ProductGrid categoryId={category.id} categories={categories} includeChildren={false} excludeId={product.id} />
        </section>
      )}
    </div>
  );
}

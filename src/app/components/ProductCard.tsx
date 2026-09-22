import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { hasManagerPricing, priceForRole, type Product, type Role } from '@/lib/types';
import Button from './ui/Button';
import Stepper from './ui/Stepper';

interface ProductCardProps {
  product: Product;
  /** Rol del usuario: un gestor ve su precio y además el de cliente final. */
  role?: Role;
  currency: string;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  onRemove: () => void;
}

/** Tarjeta de producto (solo presentación: recibe todo por props). */
export default function ProductCard({ product, role, currency, qty, onAdd, onDec, onRemove }: ProductCardProps) {
  const limited = product.stock !== null;
  const soldOut = limited && (product.stock ?? 0) <= 0;
  const isManager = hasManagerPricing(role);

  return (
    <article className="card">
      <Link className="card__link" href={`/productos/${product.id}`}>
        <div className="card__media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} loading="lazy" className="card__img" />
          ) : (
            <div className="card__placeholder">📦</div>
          )}
          {soldOut && <span className="card__tag">Agotado</span>}
          {product.imageUrls.length > 1 && <span className="card__photos">🖼 {product.imageUrls.length}</span>}
        </div>

        <div className="card__text">
          <h3 className="card__title">{product.name}</h3>
          <p className="card__desc">{product.description}</p>
        </div>
      </Link>

      <div className="card__body">
        <div className="card__row">
          <div className="card__prices">
            <strong className="price">{formatMoney(priceForRole(product, role), currency)}</strong>
            {isManager && <small className="muted">Cliente final: {formatMoney(product.price, currency)}</small>}
          </div>
          {limited && !soldOut && <small className="muted">{product.stock} disp.</small>}
        </div>

        {soldOut ? (
          <Button block disabled>Agotado</Button>
        ) : qty > 0 ? (
          <>
            <Stepper value={qty} onInc={onAdd} onDec={onDec} />
            <Button variant="link" className="danger-text" onClick={onRemove}>
              Quitar del carrito
            </Button>
          </>
        ) : (
          <Button block onClick={onAdd}>Añadir al carrito</Button>
        )}
      </div>
    </article>
  );
}

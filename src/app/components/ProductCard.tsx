import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/types';
import Button from './ui/Button';
import Stepper from './ui/Stepper';

interface ProductCardProps {
  product: Product;
  currency: string;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  onRemove: () => void;
}

/** Tarjeta de producto (solo presentación: recibe todo por props). */
export default function ProductCard({ product, currency, qty, onAdd, onDec, onRemove }: ProductCardProps) {
  const limited = product.stock !== null;
  const soldOut = limited && (product.stock ?? 0) <= 0;

  return (
    <article className="card">
      <div className="card__media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="card__img" />
        ) : (
          <div className="card__placeholder">📦</div>
        )}
        {soldOut && <span className="card__tag">Agotado</span>}
      </div>

      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__desc">{product.description}</p>

        <div className="card__row">
          <strong className="price">{formatMoney(product.price, currency)}</strong>
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
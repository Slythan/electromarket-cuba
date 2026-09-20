'use client';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import { formatMoney } from '@/lib/format';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Stepper from './ui/Stepper';
import Thumb from './ui/thumb';

export default function CartDrawer() {
  const { items, total, add, dec, remove } = useCart();
  const { settings } = useStore();
  const { user } = useAuth();
  const { open, close } = useUI();
  const toast = useToast();

  const money = (n: number) => formatMoney(n, settings.currency);

  const startCheckout = () => {
    if (!items.length) return;
    if (!user) {
      open('auth', { tab: 'login', thenCheckout: true });
      toast('Ingresa o crea tu cuenta para terminar la compra');
      return;
    }
    open('checkout');
  };

  return (
    <Modal title="Tu carrito" side="right" onClose={close}>
      {items.length === 0 ? (
        <div className="empty">Tu carrito está vacío.</div>
      ) : (
        <>
          <div className="cart-list">
            {items.map(({ product, qty }) => (
              <div className="cart-item" key={product.id}>
                <Thumb src={product.imageUrl} />
                <div className="cart-item__info">
                  <strong>{product.name}</strong>
                  <span className="muted">{money(product.price)}</span>
                  <Stepper size="sm" value={qty} onInc={() => add(product.id)} onDec={() => dec(product.id)} />
                </div>
                <div className="cart-item__side">
                  <strong>{money(product.price * qty)}</strong>
                  <Button variant="link" className="danger-text" onClick={() => remove(product.id)}>
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="totals">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <Button block onClick={startCheckout}>Finalizar compra</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
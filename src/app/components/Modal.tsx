'use client';

import { useUI } from '@/context/UIContext';
import CardDrawer from './CardDrawer';
import AuthModal from './AuthModal';
import CheckoutModal from './CheckoutModal';
import OrderDone from './OrderDone';

/** Muestra el modal que esté abierto en este momento. */
export default function Modals() {
  const { modal } = useUI();
  switch (modal) {
    case 'cart':
      return <CardDrawer />;
    case 'auth':
      return <AuthModal />;
    case 'checkout':
      return <CheckoutModal />;
    case 'done':
      return <OrderDone />;
    default:
      return null;
  }
}
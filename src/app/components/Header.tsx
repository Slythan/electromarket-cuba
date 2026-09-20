'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import Button from './ui/Button';

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const { settings } = useStore();
  const { open } = useUI();
  const toast = useToast();

  const firstName = (profile?.name || user?.email || '').split(' ')[0];

  return (
    <header className="site-header">
      <div className="container header__inner">
        <Link href="/" className="brand">
          <img className="brand__logo" src="/electromarket-logo.svg" alt="ElectroMarketCuba" />
          <span className="brand__name">{settings.storeName}</span>
        </Link>

        <nav className="nav">
          {isAdmin && (
            <Link href="/admin" className="btn btn--ghost btn--sm">
              Panel
            </Link>
          )}

          <button type="button" className="btn btn--ghost cart-btn" onClick={() => open('cart')} aria-label="Abrir carrito">
            🛒
            {count > 0 && <span className="badge">{count}</span>}
          </button>

          {user ? (
            <>
              <span className="who">Hola, {firstName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  toast('Sesión cerrada');
                }}
              >
                Salir
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => open('auth')}>
              Ingresar
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
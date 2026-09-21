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
  const { categories } = useStore();
  const { open } = useUI();
  const toast = useToast();

  const firstName = (profile?.name || user?.email || '').split(' ')[0];

  return (
    <header className="site-header">
      <div className="top-strip"><div className="container"><span>Tecnología confiable para toda Cuba · Entregas seguras</span><span>Ayuda　 Precios en {settings.currency}</span></div></div>
      <div className="container header__inner">
        <Link href="/" className="brand">
          <img className="brand__logo" src="/electromarket-logo.svg" alt="ElectroMarketCuba" />
          <span className="brand__name">{settings.storeName}</span>
        </Link>

        <nav className="nav">
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
      <nav className="main-nav" aria-label="Navegación principal">
        <div className="container main-nav__inner">
          <Link href="/" className="main-nav__link">Tienda</Link>
          {user && <Link href="/orders" className="main-nav__link">Órdenes</Link>}
          {user && <Link href="/account" className="main-nav__link">Cuenta</Link>}
          {isAdmin && <Link href="/admin" className="main-nav__link main-nav__link--admin">Panel Admin</Link>}
        </div>
      </nav>
      <nav className="category-nav" aria-label="Categorías principales"><div className="container category-nav__inner"><Link href="/" className="category-nav__all">▦　Todas las categorías</Link>{categories.filter((category) => !category.parentId).slice(0, 6).map((category) => <Link href={`/?category=${category.id}`} key={category.id}>{category.name}</Link>)}<Link className="category-nav__offer" href="/">Ofertas</Link></div></nav>
    </header>
  );
}
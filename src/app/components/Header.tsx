'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const selectedCategoryId = pathname.startsWith('/categorias/') ? pathname.split('/')[2] : '';
  const isStoreRoute = pathname === '/' || pathname.startsWith('/categorias/');

  const firstName = (profile?.name || user?.email || '').split(' ')[0];
  const navLink = (matches: boolean, extraClass = '') => `main-nav__link${matches ? ' is-active' : ''}${extraClass ? ` ${extraClass}` : ''}`;

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
          <Link href="/" className={navLink(isStoreRoute)} aria-current={isStoreRoute ? 'page' : undefined}>Tienda</Link>
          {user && <Link href="/orders" className={navLink(pathname.startsWith('/orders'))} aria-current={pathname.startsWith('/orders') ? 'page' : undefined}>Órdenes</Link>}
          {user && <Link href="/account" className={navLink(pathname.startsWith('/account'))} aria-current={pathname.startsWith('/account') ? 'page' : undefined}>Cuenta</Link>}
          {isAdmin && <Link href="/admin" className={navLink(pathname.startsWith('/admin'), 'main-nav__link--admin')} aria-current={pathname.startsWith('/admin') ? 'page' : undefined}>Panel Admin</Link>}
        </div>
      </nav>
      {isStoreRoute && <nav className="category-nav" aria-label="Categorías principales"><div className="container category-nav__inner"><Link href="/" className={`category-nav__all${!selectedCategoryId ? ' is-active' : ''}`} aria-current={!selectedCategoryId ? 'page' : undefined}>▦　Todas las categorías</Link>{categories.filter((category) => !category.parentId).slice(0, 6).map((category) => {
        const isActive = selectedCategoryId === category.id || categories.some((child) => child.id === selectedCategoryId && child.parentId === category.id);
        return <Link href={`/categorias/${category.id}`} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined} key={category.id}>{category.name}</Link>;
      })}<Link className="category-nav__offer" href="/#catalogo">Ofertas</Link></div></nav>}
    </header>
  );
}
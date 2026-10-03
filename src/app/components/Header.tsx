'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import Button from './ui/Button';
import CategoryDropdown from './CategoryDropdown';
import { categoryPath, routeEntityId } from '@/lib/slugs';

function MobileIcon({ name }: { name: 'home' | 'categories' | 'cart' | 'user' | 'close' }) {
  return (
    <svg className="mobile-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'home' && <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>}
      {name === 'categories' && <><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></>}
      {name === 'cart' && <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>}
      {name === 'user' && <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>}
      {name === 'close' && <><path d="m6 6 12 12M18 6 6 18" /></>}
    </svg>
  );
}

export default function Header() {
  const { user, profile, isAdmin, isGuest, signOut } = useAuth();
  const { count } = useCart();
  const { settings } = useStore();
  const { categories } = useStore();
  const { open } = useUI();
  const toast = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const routeCategorySegment = pathname.startsWith('/categorias/') ? pathname.split('/')[2] : '';
  const selectedCategoryId = routeCategorySegment ? routeEntityId(routeCategorySegment) : '';
  const isStoreRoute = pathname === '/' || pathname.startsWith('/categorias/') || pathname.startsWith('/productos/');
  const isAdminRoute = pathname.startsWith('/admin');
  const showStoreTools = !isAdminRoute;
  const parentCategories = categories
    .filter((category) => !category.parentId)
    .sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name));

  const firstName = isGuest ? 'invitado' : (profile?.name || user?.email || '').split(' ')[0];
  const navLink = (matches: boolean, extraClass = '') => `main-nav__link${matches ? ' is-active' : ''}${extraClass ? ` ${extraClass}` : ''}`;
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    const target = selectedCategory ? categoryPath(selectedCategory) : '/';
    router.push(`${target}${params.toString() ? `?${params.toString()}` : ''}#catalogo`);
  };

  const selectCategory = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    const target = category ? categoryPath(category) : '/';
    const queryParam = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    router.push(`${target}${queryParam}#catalogo`);
  };

  useEffect(() => {
    if (!categorySheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategorySheetOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [categorySheetOpen]);

  const openAccount = () => {
    if (!user) {
      open('auth');
      return;
    }
    router.push(isGuest ? '/orders' : '/account');
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  return (
    <>
      <header className="site-header">
      <div className="top-strip"><div className="container"><span>Tecnología confiable para toda Cuba · Entregas seguras</span><span>Ayuda　 Precios en {settings.currency}</span></div></div>
      <div className="container header__inner">
        <Link href="/" className="brand">
          <Image className="brand__logo" src="/electromarket-logo.svg" width={250} height={50} alt="ElectroMarketCuba" priority />
          <span className="brand__name">{settings.storeName}</span>
        </Link>

        {showStoreTools && <div className="header__tools">
          <CategoryDropdown categories={categories} value={selectedCategoryId} onChange={selectCategory} />
          <form className="header__search searchbar" onSubmit={submitSearch}>
            <span className="searchbar__icon" aria-hidden="true">⌕</span>
            <input className="input" type="search" placeholder="Buscar productos…" aria-label="Buscar productos" value={query} onChange={(event) => setQuery(event.target.value)} />
          </form>
        </div>}

        <nav className="nav">
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
      <nav className="main-nav" aria-label="Navegación principal">
        <div className="container main-nav__inner">
          <div className="main-nav__links">
            <Link href="/" className={navLink(isStoreRoute)} aria-current={isStoreRoute ? 'page' : undefined}>Tienda</Link>
            <Link href="/guias" className={navLink(pathname.startsWith('/guias'))} aria-current={pathname.startsWith('/guias') ? 'page' : undefined}>Guías</Link>
            <Link href="/afiliados" className={navLink(pathname.startsWith('/afiliados'))} aria-current={pathname.startsWith('/afiliados') ? 'page' : undefined}>Afiliados</Link>
            {user && <Link href="/orders" className={navLink(pathname.startsWith('/orders'))} aria-current={pathname.startsWith('/orders') ? 'page' : undefined}>{isGuest ? 'Mis pedidos' : 'Órdenes'}</Link>}
            {user && !isGuest && <Link href="/account" className={navLink(pathname.startsWith('/account'))} aria-current={pathname.startsWith('/account') ? 'page' : undefined}>Cuenta</Link>}
            {isAdmin && <Link href="/admin" className={navLink(pathname.startsWith('/admin'), 'main-nav__link--admin')} aria-current={pathname.startsWith('/admin') ? 'page' : undefined}>Panel Admin</Link>}
          </div>
          {/* El carrito vive en esta barra fija para seguir visible al hacer scroll. */}
          <div className="main-nav__actions">
            <button
              type="button"
              className="btn btn--ghost cart-btn"
              onClick={() => open('cart')}
              aria-label={count > 0 ? `Abrir carrito (${count} artículo${count === 1 ? '' : 's'})` : 'Abrir carrito'}
            >
              <span aria-hidden="true">🛒</span>
              <span className="cart-btn__label">Carrito</span>
              {count > 0 && <span className="badge">{count}</span>}
            </button>
          </div>
        </div>
      </nav>
      {isStoreRoute && <nav className="category-nav" aria-label="Categorías principales"><div className="container category-nav__inner"><Link href="/" className={`category-nav__all${!selectedCategoryId ? ' is-active' : ''}`} aria-current={!selectedCategoryId ? 'page' : undefined}>▦　Todas las categorías</Link>{categories.filter((category) => !category.parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).slice(0, 6).map((category) => {
        const isActive = selectedCategoryId === category.id || categories.some((child) => child.id === selectedCategoryId && child.parentId === category.id);
        return <Link href={categoryPath(category)} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined} key={category.id}>{category.name}</Link>;
      })}<Link className="category-nav__offer" href="/#catalogo">Ofertas</Link></div></nav>}
      {!isAdminRoute && (
        <>
          {categorySheetOpen && (
            <>
              <button className="mobile-category-backdrop" type="button" aria-label="Cerrar categorías" onClick={() => setCategorySheetOpen(false)} />
              <section id="mobile-category-sheet" className="mobile-category-sheet" aria-label="Explorar categorías">
                <header className="mobile-category-sheet__header">
                  <div><span className="eyebrow">TIENDA</span><h2>Categorías</h2></div>
                  <button className="mobile-category-sheet__close" type="button" aria-label="Cerrar categorías" onClick={() => setCategorySheetOpen(false)}><MobileIcon name="close" /></button>
                </header>
                <div className="mobile-category-sheet__body">
                  <Link href="/" className="mobile-category-row mobile-category-row--all" onClick={() => setCategorySheetOpen(false)}>
                    <span className="mobile-category-row__fallback" aria-hidden="true">⌂</span><strong>Todos los productos</strong>
                  </Link>
                  {parentCategories.map((parent) => {
                    const children = categories
                      .filter((category) => category.parentId === parent.id)
                      .sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name));
                    const isExpanded = expandedCategories.has(parent.id) || children.some((child) => child.id === selectedCategoryId);
                    return (
                      <div className="mobile-category-group" key={parent.id}>
                        <div className={`mobile-category-row${parent.id === selectedCategoryId ? ' is-active' : ''}`}>
                          <Link href={categoryPath(parent)} onClick={() => setCategorySheetOpen(false)}>
                            <span className="mobile-category-row__image">
                              {parent.imageUrl ? <Image src={parent.imageUrl} alt="" fill sizes="48px" unoptimized /> : <span aria-hidden="true">◈</span>}
                            </span>
                            <strong>{parent.name}</strong>
                          </Link>
                          {children.length > 0 && <button type="button" className="mobile-category-row__expand" aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} subcategorías de ${parent.name}`} aria-expanded={isExpanded} onClick={() => toggleCategory(parent.id)}>{isExpanded ? '−' : '+'}</button>}
                        </div>
                        {isExpanded && children.map((child) => (
                          <Link key={child.id} className={`mobile-category-child${child.id === selectedCategoryId ? ' is-active' : ''}`} href={categoryPath(child)} onClick={() => setCategorySheetOpen(false)}>{child.name}<span aria-hidden="true">›</span></Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
          <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
            <Link href="/" className={`mobile-bottom-nav__item${pathname === '/' ? ' is-active' : ''}`} aria-current={pathname === '/' ? 'page' : undefined}>
              <MobileIcon name="home" /><span>Inicio</span>
            </Link>
            <button type="button" className={`mobile-bottom-nav__item${categorySheetOpen || pathname.startsWith('/categorias/') ? ' is-active' : ''}`} aria-expanded={categorySheetOpen} aria-controls="mobile-category-sheet" onClick={() => setCategorySheetOpen((current) => !current)}>
              <MobileIcon name="categories" /><span>Categorías</span>
            </button>
            <button type="button" className="mobile-bottom-nav__item mobile-bottom-nav__cart" onClick={() => open('cart')} aria-label={count ? `Carrito, ${count} artículos` : 'Carrito'}>
              <span className="mobile-bottom-nav__icon-wrap"><MobileIcon name="cart" />{count > 0 && <span className="mobile-bottom-nav__badge">{count}</span>}</span><span>Carrito</span>
            </button>
            <button type="button" className={`mobile-bottom-nav__item${pathname.startsWith('/account') || pathname.startsWith('/orders') ? ' is-active' : ''}`} onClick={openAccount}>
              <MobileIcon name="user" /><span>Yo</span>
            </button>
          </nav>
        </>
      )}
    </>
  );
}
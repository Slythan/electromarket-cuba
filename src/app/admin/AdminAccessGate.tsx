'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AdminAccessGate({ children }: { children: ReactNode }) {
  const { isAdmin, loading, user } = useAuth();

  if (loading) {
    return <main className="container admin-access" aria-live="polite">Verificando acceso…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="container admin-access">
        <h1>Acceso restringido</h1>
        <p className="muted">{user ? 'Esta sección está disponible únicamente para administradores.' : 'Inicia sesión con una cuenta administradora para continuar.'}</p>
        <Link href="/" className="btn">Volver a la tienda</Link>
      </main>
    );
  }

  return children;
}
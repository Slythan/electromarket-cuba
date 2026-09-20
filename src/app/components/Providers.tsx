'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import { UIProvider } from '@/context/UIContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import Modals from './Modal';
import SetupNotice from './SetupNotice';

export default function Providers({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) return <SetupNotice />;

  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <UIProvider>
              {children}
              <Modals />
            </UIProvider>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ModalName = 'cart' | 'auth' | 'checkout' | 'done';
export type AuthTab = 'login' | 'register';

export interface DoneInfo {
  /** Enlace de WhatsApp con el pedido */
  url: string;
  /** false si el pedido no pudo guardarse en la base de datos */
  saved: boolean;
  error?: string;
}

interface OpenOptions {
  tab?: AuthTab;
  /** Tras iniciar sesión, continuar directo al checkout */
  thenCheckout?: boolean;
}

interface UIState {
  modal: ModalName | null;
  authTab: AuthTab;
  thenCheckout: boolean;
  done: DoneInfo | null;
  open: (modal: ModalName, options?: OpenOptions) => void;
  close: () => void;
  setAuthTab: (tab: AuthTab) => void;
  setDone: (info: DoneInfo | null) => void;
}

const UIContext = createContext<UIState | null>(null);

export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>');
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalName | null>(null);
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [thenCheckout, setThenCheckout] = useState(false);
  const [done, setDone] = useState<DoneInfo | null>(null);

  const open = useCallback((name: ModalName, options?: OpenOptions) => {
    if (name === 'auth') {
      setAuthTab(options?.tab ?? 'login');
      setThenCheckout(Boolean(options?.thenCheckout));
    }
    setModal(name);
  }, []);

  const close = useCallback(() => {
    setModal(null);
    setThenCheckout(false);
  }, []);

  const value = useMemo<UIState>(
    () => ({ modal, authTab, thenCheckout, done, open, close, setAuthTab, setDone }),
    [modal, authTab, thenCheckout, done, open, close]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
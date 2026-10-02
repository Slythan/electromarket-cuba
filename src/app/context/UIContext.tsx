'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ModalName = 'cart' | 'auth' | 'checkout' | 'done';

export type AuthTab = 'login' | 'register';

export interface DoneInfo {
  /** Enlace de WhatsApp con el pedido */
  url: string;
  /** El mismo pedido en texto plano (para copiarlo y pegarlo a mano) */
  text: string;
  /** false si el pedido no pudo guardarse en la base de datos */
  saved: boolean;
  /**
   * Identificador del pedido guardado. Si el checkout lo devuelve al guardar,
   * conviene incluirlo también en el mensaje de WhatsApp para cruzar ambos.
   */
  orderId?: string;
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
  /** Cierra el modal actual. No toca `done`: el checkout puede cerrar y publicar el pedido a la vez. */
  close: () => void;
  /** Cierra la pantalla de "pedido listo" y descarta su información. */
  dismissDone: () => void;
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

  const dismissDone = useCallback(() => {
    setDone(null);
    setModal(null);
    setThenCheckout(false);
  }, []);

  const value = useMemo<UIState>(
    () => ({ modal, authTab, thenCheckout, done, open, close, dismissDone, setAuthTab, setDone }),
    [modal, authTab, thenCheckout, done, open, close, dismissDone]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

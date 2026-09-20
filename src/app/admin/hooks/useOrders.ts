'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { translateError } from '@/lib/format';
import { fetchOrders } from '@/services/orders';
import type { Order } from '@/lib/types';

/** Carga los pedidos (solo cuando `enabled` es true, p. ej. si el usuario es admin). */
export function useOrders(enabled: boolean) {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [version, setVersion] = useState(0); // sube cada vez que se pide recargar
  const [loadedVersion, setLoadedVersion] = useState(-1);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchOrders()
      .then((data) => active && setOrders(data))
      .catch((e) => active && toast(translateError(e instanceof Error ? e.message : undefined)))
      .finally(() => active && setLoadedVersion(version));
    return () => {
      active = false;
    };
  }, [enabled, version, toast]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const loading = enabled && loadedVersion !== version;

  return { orders, setOrders, loading, reload };
}
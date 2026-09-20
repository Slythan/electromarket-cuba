'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useUI } from '@/context/UIContext';
import { buildWhatsAppUrl, onlyDigits } from '@/lib/format';
import { createOrder } from '@/services/orders';
import type { CustomerData } from '@/lib/types';

/**
 * Lógica de "Finalizar compra": guarda el pedido en la base de datos
 * y abre WhatsApp con el mensaje listo.
 */
export function useCheckout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const { settings, reloadProducts } = useStore();
  const { open, setDone } = useUI();

  const whatsappReady = onlyDigits(settings.whatsapp).length > 0;

  /** Devuelve un mensaje de error, o null si todo salió bien. */
  const submit = useCallback(
    async (customer: CustomerData): Promise<string | null> => {
      if (!whatsappReady) return 'La tienda no tiene WhatsApp configurado.';
      if (!user) return 'Tu sesión aún se está cargando. Intenta de nuevo en un momento.';
      if (!customer.name || !customer.phone || !customer.address)
        return 'Nombre, teléfono y dirección son obligatorios.';
      if (!items.length) return 'Tu carrito está vacío.';

      const orderTotal = Math.round(total * 100) / 100;

      // La pestaña de WhatsApp se abre ahora (gesto del usuario) para que el navegador no la bloquee.
      let popup: Window | null = null;
      try {
        popup = window.open('', '_blank');
      } catch {
        /* se mostrará el botón de respaldo */
      }

      const url = buildWhatsAppUrl({
        number: settings.whatsapp,
        storeName: settings.storeName,
        currency: settings.currency,
        customer,
        items,
        total: orderTotal,
      });

      let saved = true;
      try {
        await createOrder({
          userId: user.id,
          customer,
          items: items.map(({ product, qty }) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            qty,
          })),
          total: orderTotal,
        });
      } catch {
        saved = false;
      }

      if (popup) {
        try {
          popup.location.href = url;
        } catch {
          /* se mostrará el botón de respaldo */
        }
      }

      clear();
      setDone({ url, saved });
      open('done');
      await reloadProducts(); // refleja el stock descontado
      return null;
    },
    [whatsappReady, user, items, total, settings, clear, setDone, open, reloadProducts]
  );

  return { submit, whatsappReady };
}
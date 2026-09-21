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
  const { user, profile } = useAuth();
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

      const catalogTotal = Math.round(total * 100) / 100;
      const isManager = profile?.role === 'manager';
      const negotiatedTotal = isManager ? Math.round((customer.negotiatedTotal ?? 0) * 100) / 100 : catalogTotal;
      const deliveryFee = isManager ? Math.round((customer.deliveryFee ?? 0) * 100) / 100 : 0;
      if (isManager && (!Number.isFinite(negotiatedTotal) || negotiatedTotal <= 0)) return 'El precio negociado debe ser mayor que cero.';
      if (isManager && (!Number.isFinite(deliveryFee) || deliveryFee < 0)) return 'La mensajería no puede ser negativa.';
      if (isManager && negotiatedTotal > catalogTotal) return 'El precio negociado no puede superar el precio de catálogo.';
      const commissionBase = Math.round((catalogTotal - negotiatedTotal) * 100) / 100;
      const commission = Math.round((commissionBase - deliveryFee) * 100) / 100;
      const orderTotal = negotiatedTotal;

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
        managerName: isManager ? profile?.name : undefined,
        catalogTotal: isManager ? catalogTotal : undefined,
        negotiatedTotal: isManager ? negotiatedTotal : undefined,
        commissionBase: isManager ? commissionBase : undefined,
        deliveryFee: isManager ? deliveryFee : undefined,
        commission: isManager ? commission : undefined,
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
          negotiatedTotal: isManager ? negotiatedTotal : null,
          commissionBase: isManager ? commissionBase : null,
          deliveryFee: isManager ? deliveryFee : null,
          commission: isManager ? commission : null,
          managerName: isManager ? profile?.name ?? null : null,
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
    [whatsappReady, user, profile, items, total, settings, clear, setDone, open, reloadProducts]
  );

  return { submit, whatsappReady };
}
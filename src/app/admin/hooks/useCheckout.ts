'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useUI } from '@/context/UIContext';
import { buildOrderMessage, whatsAppLink, onlyDigits } from '@/lib/format';
import { deliveryFeeFor, findZone, isFreeDelivery } from '@/lib/delivery';
import { createOrder } from '@/services/orders';
import { hasManagerPricing, type CustomerData } from '@/lib/types';

/**
 * Lógica de "Finalizar compra": guarda el pedido en la base de datos
 * y abre WhatsApp con el mensaje listo.
 */
export function useCheckout() {
  const { user, profile } = useAuth();
  const { items, total, clear } = useCart();
  const { settings, deliveryZones, reloadProducts } = useStore();
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
      const isManager = hasManagerPricing(profile?.role);
      const negotiatedTotal = isManager ? Math.round((customer.negotiatedTotal ?? 0) * 100) / 100 : catalogTotal;
      if (isManager && (!Number.isFinite(negotiatedTotal) || negotiatedTotal <= 0)) return 'El precio negociado debe ser mayor que cero.';
      if (isManager && negotiatedTotal > catalogTotal) return 'El precio negociado no puede superar el precio de catálogo.';

      // Mensajería: el municipio fija el precio y el pedido se guarda con el nombre del municipio.
      const zone = isManager ? findZone(deliveryZones, customer.deliveryZone ?? '') : undefined;
      if (isManager && !zone) return 'Elige el municipio de entrega para calcular la mensajería.';
      const deliveryFee = isManager ? deliveryFeeFor(negotiatedTotal, zone?.price ?? null) : 0;
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

      const message = buildOrderMessage({
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
        deliveryZone: isManager ? zone?.municipality : undefined,
        freeDelivery: isManager ? isFreeDelivery(negotiatedTotal) : undefined,
        commission: isManager ? commission : undefined,
      });
      const url = whatsAppLink(settings.whatsapp, message);

      let saved = true;
      let saveError = '';
      try {
        await createOrder({
          userId: user.id,
          // El municipio queda guardado en el pedido con su nombre canónico.
          customer: { ...customer, deliveryZone: zone?.municipality },
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
      } catch (error) {
        saved = false;
        saveError = error instanceof Error ? error.message : '';
      }

      if (popup) {
        try {
          popup.location.href = url;
        } catch {
          /* se mostrará el botón de respaldo */
        }
      }

      if (!saved) {
        try { popup?.close(); } catch { /* el navegador puede impedir cerrar la pestaña */ }
        return `WhatsApp está listo, pero el pedido no se guardó: ${saveError || 'revisa las políticas de orders en Supabase.'}`;
      }

      clear();
      setDone({ url, text: message, saved, error: saveError || undefined });
      open('done');
      await reloadProducts(); // refleja el stock descontado
      return null;
    },
    [whatsappReady, user, profile, items, total, settings, deliveryZones, clear, setDone, open, reloadProducts]
  );

  return { submit, whatsappReady };
}
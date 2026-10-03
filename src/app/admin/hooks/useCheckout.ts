'use client';

import { useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useUI } from '@/context/UIContext';
import { buildOrderMessage, whatsAppLink, onlyDigits, translateError } from '@/lib/format';
import { deliveryFeeFor, findZone } from '@/lib/delivery';
import { createOrder, type CreatedOrder } from '@/services/orders';
import { hasManagerPricing, type CustomerData } from '@/lib/types';

/**
 * Lógica de "Finalizar compra": guarda el pedido en la base de datos
 * y abre WhatsApp con el mensaje listo.
 */
export function useCheckout() {
  const { user, profile } = useAuth();
  const { items, total, clear, refreshProducts } = useCart();
  const { settings, deliveryZones, reloadProducts, reloadDeliveryZones } = useStore();
  const { open, setDone } = useUI();
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);

  const whatsappReady = onlyDigits(settings.whatsapp).length > 0;

  /** Devuelve un mensaje de error, o null si todo salió bien. */
  const submit = useCallback(
    async (customer: CustomerData): Promise<string | null> => {
      if (!whatsappReady) return 'La tienda no tiene WhatsApp configurado.';
      if (!user) return 'Tu sesión aún se está cargando. Intenta de nuevo en un momento.';
      if (!customer.name || !customer.phone || !customer.address)
        return 'Nombre, teléfono y dirección son obligatorios.';
      if (!items.length) return 'Tu carrito está vacío.';

      // Para un gestor/admin el carrito ya muestra sus precios de gestor; se calcula
      // el costo de forma explícita para no depender de cómo se pinte el carrito.
      const cartTotal = Math.round(total * 100) / 100;
      const isManager = hasManagerPricing(profile?.role);
      // Precio pactado: lo que paga el cliente final (puede ser mayor que el costo).
      const pactado = isManager ? Math.round((customer.negotiatedTotal ?? 0) * 100) / 100 : cartTotal;
      if (isManager && (!Number.isFinite(pactado) || pactado <= 0)) return 'El precio pactado debe ser mayor que cero.';

      // Mensajería: el municipio fija el precio y el pedido se guarda con el nombre del municipio.
      const zone = findZone(deliveryZones, customer.deliveryZone ?? '');
      if (!zone) return 'Elige el municipio de entrega para calcular la mensajería.';
      const deliveryBasis = isManager ? pactado : cartTotal;
      const expectedDeliveryFee = deliveryFeeFor(deliveryBasis, zone.price);
      const customerData = {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
      };
      const expectedItems = items.map(({ product, qty }) => ({
        id: product.id,
        qty,
        expectedPrice: product.price,
      }));
      const fingerprint = JSON.stringify({
        customer: customerData,
        items: expectedItems,
        negotiatedTotal: isManager ? pactado : null,
        deliveryZone: zone.municipality,
        expectedDeliveryFee,
      });
      if (idempotency.current?.fingerprint !== fingerprint) {
        idempotency.current = { fingerprint, key: crypto.randomUUID() };
      }
      const idempotencyKey = idempotency.current.key;

      // La pestaña de WhatsApp se abre ahora (gesto del usuario) para que el navegador no la bloquee.
      let popup: Window | null = null;
      try {
        popup = window.open('', '_blank');
      } catch {
        /* se mostrará el botón de respaldo */
      }

      let created: CreatedOrder;
      try {
        created = await createOrder({
          idempotencyKey,
          customer: customerData,
          items: expectedItems,
          negotiatedTotal: isManager ? pactado : null,
          deliveryZone: zone.municipality,
          expectedDeliveryFee,
        });
      } catch (error) {
        try { popup?.close(); } catch { /* el navegador puede impedir cerrar la pestaña */ }
        const message = error instanceof Error ? error.message : '';
        if (message.startsWith('PRICE_CHANGED:')) {
          await refreshProducts().catch(() => undefined);
          return 'Cambió el precio de un producto. Actualizamos tu carrito; revisa el nuevo total y confirma otra vez.';
        }
        if (message.startsWith('STOCK_CHANGED:')) {
          await refreshProducts().catch(() => undefined);
          return 'Cambió la disponibilidad. Actualizamos tu carrito; revisa las cantidades y confirma otra vez.';
        }
        if (message.startsWith('DELIVERY_CHANGED:')) {
          await reloadDeliveryZones();
          return 'Cambió el precio de mensajería. Actualizamos las tarifas; revisa el total y confirma otra vez.';
        }
        return translateError(message) || 'No se pudo guardar el pedido. Revisa tu conexión e inténtalo de nuevo.';
      }

      idempotency.current = null;
      const messageItems = created.items.map((line) => {
        const snapshot = items.find((item) => item.product.id === line.id)?.product ?? {
          id: line.id,
          name: line.name,
          price: line.price,
          managerPrice: line.price,
          stock: null,
          description: '',
          imageUrl: '',
          imageUrls: [],
          visible: true,
        };
        return { product: { ...snapshot, name: line.name, price: line.price }, qty: line.qty };
      });
      const message = buildOrderMessage({
        number: settings.whatsapp,
        storeName: settings.storeName,
        currency: settings.currency,
        customer,
        items: messageItems,
        total: created.total,
        managerName: isManager ? created.managerName ?? undefined : undefined,
        managerCost: isManager ? created.managerCost ?? undefined : undefined,
        pactado: isManager ? created.total : undefined,
        commissionBase: isManager ? created.commissionBase ?? undefined : undefined,
        deliveryFee: created.deliveryFee,
        deliveryZone: created.deliveryZone ?? undefined,
        freeDelivery: isManager ? created.deliveryFee === 0 : undefined,
        commission: isManager ? created.commission ?? undefined : undefined,
      });
      const url = whatsAppLink(settings.whatsapp, message);

      if (popup) {
        try {
          popup.location.href = url;
        } catch {
          /* se mostrará el botón de respaldo */
        }
      }

      clear();
      setDone({ url, text: message, saved: true });
      open('done');
      await reloadProducts(); // refleja el stock descontado
      return null;
    },
    [whatsappReady, user, profile, items, total, settings, deliveryZones, clear, refreshProducts, reloadDeliveryZones, setDone, open, reloadProducts]
  );

  return { submit, whatsappReady };
}
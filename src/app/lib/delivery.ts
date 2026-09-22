import type { DeliveryZone } from './types';

/**
 * Mensajería gratis cuando el pedido vale menos de este importe (en la moneda de la tienda).
 * Cámbialo aquí y cambia en toda la tienda (checkout, comisión del gestor y panel).
 */
export const FREE_DELIVERY_UNDER = 5;

/** Mensajería gratis si el pedido no llega al mínimo. */
export const isFreeDelivery = (orderTotal: number): boolean =>
  Number.isFinite(orderTotal) && orderTotal < FREE_DELIVERY_UNDER;

/**
 * Precio de mensajería que se le descuenta al gestor.
 * Si el pedido vale menos de `FREE_DELIVERY_UNDER`, la entrega es gratis.
 */
export const deliveryFeeFor = (orderTotal: number, zonePrice: number | null | undefined): number => {
  if (!Number.isFinite(orderTotal) || isFreeDelivery(orderTotal)) return 0;
  const price = typeof zonePrice === 'number' && Number.isFinite(zonePrice) ? zonePrice : 0;
  return Math.max(0, Math.round(price * 100) / 100);
};

/** Busca el municipio por su nombre (el que se guarda en el pedido). */
export const findZone = (zones: DeliveryZone[], municipality: string): DeliveryZone | undefined =>
  zones.find((zone) => zone.municipality === municipality);
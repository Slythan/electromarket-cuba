/**
 * Cálculo de la comisión del gestor.
 *
 * El gestor compra al «precio de gestor» (su costo) y vende al «precio pactado»
 * con el cliente. Lo que gana es la diferencia menos lo que paga de mensajería:
 *
 *   margen bruto    = precio pactado − costo del gestor
 *   comisión final  = margen bruto − mensajería
 */

/** Redondeo a 2 decimales, tolerante a valores vacíos o inválidos. */
export const round2 = (value: number): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
};

export interface CommissionBreakdown {
  /** Lo que paga el cliente final. */
  pactado: number;
  /** Lo que le cuesta el pedido al gestor (suma de precios de gestor). */
  managerCost: number;
  /** Diferencia entre lo pactado y el costo, antes de la mensajería. */
  commissionBase: number;
  /** Mensajería descontada (0 si el pedido es pequeño). */
  deliveryFee: number;
  /** Lo que cobra el gestor. */
  commission: number;
}

export const commissionFor = (pactado: number, managerCost: number, deliveryFee: number): CommissionBreakdown => {
  const pactadoR = round2(pactado);
  const managerCostR = round2(managerCost);
  const deliveryR = round2(deliveryFee);
  const commissionBase = round2(pactadoR - managerCostR);
  return { pactado: pactadoR, managerCost: managerCostR, commissionBase, deliveryFee: deliveryR, commission: round2(commissionBase - deliveryR) };
};

/** Lo que le cuesta al gestor un carrito (suma de precios de gestor). */
export const managerCostOf = (items: { product: { managerPrice: number }; qty: number }[]): number =>
  round2(items.reduce((sum, item) => sum + item.product.managerPrice * item.qty, 0));
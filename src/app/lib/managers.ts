import type { Order } from './types';
import { round2 } from './commission';

export interface ManagerSummary {
  name: string;
  orders: number;
  /** Ventas pactadas de la semana. */
  sales: number;
  /** Total a pagar al gestor. */
  commission: number;
  /** Comisión de los pedidos ya cobrados. */
  collected: number;
  /** Comisión de los pedidos que siguen en curso. */
  pending: number;
}

/**
 * Agrupa los pedidos por gestor y suma lo que cobra cada uno.
 * Solo cuenta los pedidos de gestor (los que tienen comisión) y ordena
 * de mayor a menor comisión.
 */
export function summarizeByManager(orders: Order[]): ManagerSummary[] {
  const byManager = new Map<string, ManagerSummary>();
  for (const order of orders) {
    if (order.commission == null) continue; // pedido de cliente final
    const name = order.managerName?.trim() || 'Sin gestor asignado';
    const current = byManager.get(name) ?? { name, orders: 0, sales: 0, commission: 0, collected: 0, pending: 0 };
    current.orders += 1;
    current.sales = round2(current.sales + order.total);
    current.commission = round2(current.commission + order.commission);
    if (order.status === 'cobrada') current.collected = round2(current.collected + order.commission);
    else current.pending = round2(current.pending + order.commission);
    byManager.set(name, current);
  }
  return [...byManager.values()].sort((a, b) => b.commission - a.commission);
}

/** Totales de todos los gestores en el rango consultado. */
export const summarizeTotals = (summaries: ManagerSummary[]): ManagerSummary => ({
  name: 'Total',
  orders: summaries.reduce((sum, item) => sum + item.orders, 0),
  sales: round2(summaries.reduce((sum, item) => sum + item.sales, 0)),
  commission: round2(summaries.reduce((sum, item) => sum + item.commission, 0)),
  collected: round2(summaries.reduce((sum, item) => sum + item.collected, 0)),
  pending: round2(summaries.reduce((sum, item) => sum + item.pending, 0)),
});
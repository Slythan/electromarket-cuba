import type { CartItem, CustomerData } from './types';

export const formatMoney = (amount: number, currency: string) =>
  `${(Number(amount) || 0).toFixed(2)} ${currency}`;

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Traduce los errores más comunes de Supabase al español. */
export function translateError(message?: string): string {
  const m = message ?? '';
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/already registered|already been registered/i.test(m)) return 'Ya existe una cuenta con ese correo.';
  if (/Email not confirmed/i.test(m)) return 'Confirma tu correo antes de ingresar.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera unos minutos.';
  if (/row-level security|permission denied/i.test(m)) return 'No tienes permiso para esta acción.';
  if (/Password should be|weak/i.test(m)) return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión con el servidor. Revisa tu internet.';
  return m || 'Ocurrió un error desconocido.';
}

interface WhatsAppParams {
  number: string;
  storeName: string;
  currency: string;
  customer: CustomerData;
  items: CartItem[];
  total: number;
  managerName?: string;
  catalogTotal?: number;
  negotiatedTotal?: number;
  commissionBase?: number;
  deliveryFee?: number;
  commission?: number;
}

/** Construye el enlace wa.me con el pedido ya redactado. */
export function buildWhatsAppUrl({ number, storeName, currency, customer, items, total, managerName, catalogTotal, negotiatedTotal, commissionBase, deliveryFee, commission }: WhatsAppParams): string {
  const lines: string[] = [
    `🛍️ NUEVO PEDIDO - ${storeName}`,
    '',
    `• 👤 Cliente: ${customer.name}`,
    `• 📞 Teléfono: ${customer.phone}`,
    `• 📍 Dirección: ${customer.address}`,
  ];
  if (managerName) lines.push(`• 🤝 Gestor: ${managerName}`);
  if (customer.notes) lines.push(`• 📝 Notas: ${customer.notes}`);
  lines.push('', '🛒 PRODUCTOS:');
  items.forEach(({ product, qty }) =>
    lines.push(`  • ${qty} x ${product.name} - ${formatMoney(product.price * qty, currency)}`)
  );
  lines.push('', `💰 Total a cobrar: ${formatMoney(total, currency)}`);
  if (managerName && catalogTotal !== undefined && negotiatedTotal !== undefined && commissionBase !== undefined && deliveryFee !== undefined && commission !== undefined) {
    lines.push('', '📊 RESUMEN DEL GESTOR:', `• 🏷️ Precio de catálogo: ${formatMoney(catalogTotal, currency)}`, `• 🤝 Precio negociado: ${formatMoney(negotiatedTotal, currency)}`, `• 📈 Comisión base: ${formatMoney(commissionBase, currency)}`, `• 🚚 Mensajería: ${formatMoney(deliveryFee, currency)}`, `• ✅ Comisión final: ${formatMoney(commission, currency)}`);
  }
  const message = lines.join('\n');
  return `https://wa.me/${onlyDigits(number)}?${new URLSearchParams({ text: message }).toString()}`;
}
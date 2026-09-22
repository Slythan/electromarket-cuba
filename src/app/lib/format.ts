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
  if (/row-level security|permission denied/i.test(m)) {
    if (/delivery_zones/i.test(m))
      return 'Faltan las políticas de la tabla de mensajería: ejecuta supabase_delivery.sql completo en el SQL Editor de Supabase.';
    return 'No tienes permiso para esta acción.';
  }
  if (/could not find the table .*delivery_zones|delivery_zones.*schema cache/i.test(m))
    return 'Falta la tabla de mensajería: ejecuta supabase_delivery.sql en el SQL Editor de Supabase.';
  if (/column .*image_urls.* does not exist/i.test(m))
    return 'Falta actualizar la base de datos: ejecuta supabase_products.sql en el SQL Editor de Supabase.';
  if (/products_image_urls_max/i.test(m)) return 'Cada producto admite como máximo 3 fotos.';
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
  /** Costo del gestor: suma de precios de gestor del pedido. */
  managerCost?: number;
  /** Precio pactado con el cliente (lo que paga). */
  pactado?: number;
  /** Margen bruto: pactado − costo del gestor. */
  commissionBase?: number;
  deliveryFee?: number;
  /** Municipio de entrega (solo pedidos de gestor). */
  deliveryZone?: string;
  /** true cuando la mensajería salió gratis por ser un pedido pequeño. */
  freeDelivery?: boolean;
  commission?: number;
}

/** Redacta el mensaje del pedido (texto plano con emojis). */
export function buildOrderMessage({ storeName, currency, customer, items, total, managerName, managerCost, pactado, commissionBase, deliveryFee, deliveryZone: zoneName, freeDelivery, commission }: WhatsAppParams): string {
  // Los emojis se escriben con escapes \u{...} (ASCII en el archivo): así ningún
  // editor, consola o herramienta que no soporte caracteres fuera del BMP puede
  // corromperlos. En tiempo de ejecución el texto es idéntico.
  const lines: string[] = [
    `\u{1F6CD}\uFE0F NUEVO PEDIDO - ${storeName}`,
    '',
    `• \u{1F464} Cliente: ${customer.name}`,
    `• \u{1F4DE} Teléfono: ${customer.phone}`,
    `• \u{1F4CD} Dirección: ${customer.address}`,
  ];
  if (managerName) lines.push(`• \u{1F91D} Gestor: ${managerName}`);
  if (customer.notes) lines.push(`• \u{1F4DD} Notas: ${customer.notes}`);
  lines.push('', '\u{1F6D2} PRODUCTOS:');
  items.forEach(({ product, qty }) =>
    lines.push(`  • ${qty} x ${product.name} - ${formatMoney(product.price * qty, currency)}`)
  );
  lines.push('', `\u{1F4B0} Total a cobrar: ${formatMoney(total, currency)}`);
  if (managerName && managerCost !== undefined && pactado !== undefined && commissionBase !== undefined && deliveryFee !== undefined && commission !== undefined) {
    // La mensajería sale del municipio; si el pedido es pequeño, es gratis.
    const zoneLabel = zoneName ? ` (${zoneName})` : '';
    const deliveryLabel = freeDelivery ? `Gratis${zoneLabel}` : `${formatMoney(deliveryFee, currency)}${zoneLabel}`;
    lines.push('', '\u{1F4CA} RESUMEN DEL GESTOR:', `• \u{1F91D} Precio pactado: ${formatMoney(pactado, currency)}`, `• \u{1F4E6} Costo del gestor: ${formatMoney(managerCost, currency)}`, `• \u{1F4C8} Margen bruto: ${formatMoney(commissionBase, currency)}`, `• \u{1F69A} Mensajería: ${deliveryLabel}`, `• \u2705 Comisión del gestor: ${formatMoney(commission, currency)}`);
  }
  return lines.join('\n');
}

/**
 * Enlace de WhatsApp con un mensaje ya redactado.
 * Se usa api.whatsapp.com/send en vez de wa.me: wa.me corrompe los emojis
 * fuera del BMP (👤📞📍🤝🛒💰📊) al abrirse desde WhatsApp Desktop.
 * Se usa encodeURIComponent (espacios como %20 y emojis en UTF-8): con URLSearchParams
 * los espacios viajaban como '+' y WhatsApp los mostraba literales (+NUEVO+PEDIDO+).
 */
export const whatsAppLink = (number: string, message: string): string =>
  `https://api.whatsapp.com/send?phone=${onlyDigits(number)}&text=${encodeURIComponent(message)}`;

/** Construye el enlace de WhatsApp con el pedido ya redactado. */
export const buildWhatsAppUrl = (params: WhatsAppParams): string =>
  whatsAppLink(params.number, buildOrderMessage(params));
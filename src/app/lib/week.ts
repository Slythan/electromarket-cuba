/** Lunes 00:00 de la semana de `date` (semanas de lunes a domingo). */
export function startOfWeek(date: Date = new Date()): Date {
  const result = new Date(date);
  const daysSinceMonday = (result.getDay() + 6) % 7; // domingo (0) -> 6
  result.setDate(result.getDate() - daysSinceMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Rango [desde, hasta) de la semana desplazada `offset` semanas (0 = semana actual). */
export function weekRange(offset = 0): { from: Date; to: Date } {
  const from = addDays(startOfWeek(), offset * 7);
  return { from, to: addDays(from, 7) };
}

const shortDate = (date: Date) => date.toLocaleDateString('es', { day: '2-digit', month: 'short' });

/** Texto legible del rango, p. ej. «15 sep – 21 sep». */
export const weekLabel = ({ from, to }: { from: Date; to: Date }): string =>
  `${shortDate(from)} – ${shortDate(addDays(to, -1))}`;
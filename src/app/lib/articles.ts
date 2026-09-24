/**
 * Guías y artículos del blog de ElectroMarketCuba.
 * Contenido estático optimizado para SEO: cada artículo enlaza a categorías y productos.
 */

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'img'; src: string; alt: string }
  | { type: 'cta'; href: string; label: string };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readingTime: string;
  tag: string;
  coverImage?: string | null;
  blocks: ArticleBlock[];
}

/**
 * Convierte el texto del editor en bloques renderizables.
 * Compatible con Markdown estándar (lo que entregan las IAs) y con los marcadores propios:
 *   # Título / ## Título / ### Título   -> encabezado
 *   - item / * item / 1. item           -> lista (líneas consecutivas)
 *   ![alt](url)                          -> imagen
 *   [imagen]URL[/imagen]                 -> imagen (marcador del botón del panel)
 *   [Texto](url) sola en una línea       -> botón/enlace destacado
 *   [boton]URL|Texto[/boton]             -> botón (marcador propio)
 *   **negrita** y [enlaces](url) dentro del texto se renderizan en línea.
 *   Párrafos separados por líneas en blanco.
 */
export function parseGuideContent(content: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const chunks = content.split(/\n\s*\n/);

  const isListItem = (l: string) => /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l);
  const stripMarker = (l: string) => l.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim();

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Bloque de lista: todas las líneas son viñetas o numeración.
    const listItems = lines.filter(isListItem).map(stripMarker);
    if (listItems.length === lines.length) {
      blocks.push({ type: 'ul', items: listItems });
      continue;
    }

    for (const line of lines) {
      const imgMd = line.match(/^!\[(.*?)\]\((.+?)\)$/);
      const linkMd = line.match(/^\[(.+?)\]\((https?:\/\/.+?|\/.+?)\)$/);

      if (/^#{1,6}\s+/.test(line)) {
        blocks.push({ type: 'h2', text: line.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '').trim() });
      } else if (line.startsWith('[imagen]') && line.endsWith('[/imagen]')) {
        const src = line.slice(8, -9).trim();
        if (src) blocks.push({ type: 'img', src, alt: '' });
      } else if (imgMd) {
        blocks.push({ type: 'img', src: imgMd[2], alt: imgMd[1] });
      } else if (line.startsWith('[boton]') && line.endsWith('[/boton]')) {
        const inner = line.slice(7, -8);
        const [href, label] = inner.split('|').map((s) => s.trim());
        if (href && label) blocks.push({ type: 'cta', href, label });
      } else if (linkMd) {
        blocks.push({ type: 'cta', href: linkMd[2], label: linkMd[1] });
      } else {
        blocks.push({ type: 'p', text: line });
      }
    }
  }
  return blocks;
}

/** Estima el tiempo de lectura a partir del texto plano. */
export function estimateReadingTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 180))} min`;
}

export const ARTICLES: Article[] = [
  {
    slug: 'como-elegir-estacion-de-energia-apagones-cuba',
    title: 'Cómo elegir una estación de energía para los apagones en Cuba',
    excerpt:
      'Capacidad, potencia, tipos de batería y qué equipos puedes mantener encendidos: la guía completa para elegir tu EcoFlow, Oukitel o Pecrón en La Habana.',
    date: '2026-09-24',
    readingTime: '6 min',
    tag: 'Energía',
    blocks: [
      {
        type: 'p',
        text: 'Con los apagones frecuentes, una estación de energía portátil se ha convertido en una de las inversiones más útiles para cualquier hogar o negocio en Cuba. Pero no todas son iguales: elegir mal significa quedarte corto de autonomía o pagar de más por capacidad que no necesitas.',
      },
      { type: 'h2', text: '1. Calcula cuánta energía necesitas' },
      {
        type: 'p',
        text: 'La capacidad se mide en vatios-hora (Wh). Para saber cuánta necesitas, suma el consumo de los equipos que quieres mantener encendidos y multiplícalo por las horas de apagón que quieres cubrir.',
      },
      {
        type: 'ul',
        items: [
          'Ventilador: 40-60 W → una estación de 500 Wh lo mantiene 8-10 horas.',
          'Refrigerador: 100-200 W (con picos de arranque) → necesitas al menos 1000 Wh y 1500 W de potencia.',
          'Router WiFi + laptop + luces LED: 50-80 W → con 500 Wh tienes para toda la noche.',
          'Televisor: 80-150 W → suma según las horas de uso.',
        ],
      },
      { type: 'h2', text: '2. Potencia de salida: el dato que muchos olvidan' },
      {
        type: 'p',
        text: 'No basta con la capacidad: la potencia máxima (W) determina qué equipos puedes conectar. Un refrigerador o una bomba de agua tienen picos de arranque de 2-3 veces su consumo normal. Marcas como EcoFlow incluyen modo X-Boost que permite alimentar equipos por encima de la potencia nominal.',
      },
      { type: 'h2', text: '3. Tipo de batería: LiFePO4 vs litio convencional' },
      {
        type: 'p',
        text: 'Las baterías LiFePO4 (fosfato de hierro y litio) duran 3000+ ciclos frente a los 500-800 de las de litio convencional, y son más seguras con el calor. Para uso diario en Cuba, valen la diferencia de precio con creces.',
      },
      { type: 'h2', text: '4. Carga solar: independencia total' },
      {
        type: 'p',
        text: 'Combinar tu estación con paneles solares plegables te permite recargarla durante el día aunque no haya electricidad. Busca estaciones con entrada solar MPPT, que aprovechan mejor la luz disponible.',
      },
      { type: 'h2', text: 'Nuestras recomendaciones' },
      {
        type: 'ul',
        items: [
          'Uso básico (ventilador, router, luces): estaciones de 500-700 Wh.',
          'Hogar completo (refrigerador incluido): 1000-2000 Wh con 1500 W o más.',
          'Negocios y uso intensivo: 2000+ Wh expandibles con baterías extra.',
        ],
      },
      {
        type: 'p',
        text: 'En ElectroMarketCuba tenemos estaciones EcoFlow, Oukitel y Pecrón con entrega en La Habana, asesoría para elegir la capacidad correcta y garantía real.',
      },
      { type: 'cta', href: '/categorias/e21e251e-2cc0-418c-8e5f-69940d15167e', label: 'Ver estaciones de energía y paneles solares →' },
    ],
  },
  {
    slug: 'bicicleta-electrica-la-habana-guia-compra',
    title: 'Qué bicicleta eléctrica comprar en La Habana: guía 2026',
    excerpt:
      'Autonomía real, motor, batería extraíble y repuestos: todo lo que debes revisar antes de comprar una bicicleta o moto eléctrica para moverte por La Habana.',
    date: '2026-09-24',
    readingTime: '5 min',
    tag: 'Movilidad',
    blocks: [
      {
        type: 'p',
        text: 'La movilidad eléctrica se ha vuelto la forma más práctica de moverse por La Habana: sin colas de combustible, sin mantenimiento costoso y con un costo por kilómetro mínimo. Pero el mercado tiene opciones muy desiguales. Esto es lo que debes revisar antes de comprar.',
      },
      { type: 'h2', text: 'Autonomía real, no la del anuncio' },
      {
        type: 'p',
        text: 'La autonomía declarada se mide en condiciones ideales: peso ligero, terreno plano y velocidad mínima. En condiciones reales (subidas, peso del conductor, viento) espera un 60-70% de esa cifra. Para uso diario en la ciudad, busca al menos 40-50 km de autonomía real.',
      },
      { type: 'h2', text: 'Batería: extraíble y con celdas de calidad' },
      {
        type: 'ul',
        items: [
          'Extraíble: imprescindible si vives en un piso alto — subes solo la batería a cargar.',
          'Voltaje y amperaje: 48V 12Ah o superior da buen equilibrio entre potencia y autonomía.',
          'Celdas de marca reconocida: duran más ciclos y degradan menos con el calor.',
        ],
      },
      { type: 'h2', text: 'Motor y potencia' },
      {
        type: 'p',
        text: 'Para La Habana, un motor de 350-500 W es suficiente para la mayoría de recorridos. Si tu ruta incluye subidas pronunciadas o llevas carga frecuente, considera 750 W o más. Los motores en el buje trasero ofrecen mejor tracción que los delanteros.',
      },
      { type: 'h2', text: 'Repuestos y servicio: la pregunta clave' },
      {
        type: 'p',
        text: 'Antes de comprar pregunta: ¿hay repuestos de esta marca en Cuba? ¿Quién la repara si falla el controlador o la batería? Comprar en una tienda con soporte local y garantía te ahorra el problema más común: un equipo varado por un repuesto de 20 dólares.',
      },
      {
        type: 'p',
        text: 'En ElectroMarketCuba seleccionamos bicicletas y motos eléctricas con repuestos disponibles, garantía y asesoría antes y después de la compra.',
      },
      { type: 'cta', href: '/categorias/cc733564-e20c-4bd0-8474-78d1e3285ce0', label: 'Ver bicicletas y motos eléctricas →' },
    ],
  },
  {
    slug: 'paneles-solares-casa-cuba-lo-que-debes-saber',
    title: 'Paneles solares para tu casa en Cuba: lo que debes saber antes de invertir',
    excerpt:
      'Cuántos paneles necesitas, diferencia entre sistemas con y sin baterías, y cómo calcular el retorno de tu inversión en energía solar.',
    date: '2026-09-24',
    readingTime: '7 min',
    tag: 'Energía',
    blocks: [
      {
        type: 'p',
        text: 'La energía solar es la única solución definitiva a los apagones: una vez instalada, el combustible es gratis. Pero es una inversión importante y conviene entender las opciones antes de decidir.',
      },
      { type: 'h2', text: 'Opción 1: Estación de energía + paneles plegables' },
      {
        type: 'p',
        text: 'La forma más rápida de empezar: sin instalación, sin obras y portable. Ideal para apartamentos y para cubrir lo esencial (refrigerador, ventiladores, comunicaciones). Puedes empezar con un panel de 200-400 W y ampliar después.',
      },
      { type: 'h2', text: 'Opción 2: Sistema fijo con inversor y baterías' },
      {
        type: 'p',
        text: 'Para casas con techo propio: paneles rígidos en el techo, inversor híbrido y banco de baterías. Cubre toda la casa y se amortiza con los años. Requiere instalación profesional y un estudio previo del consumo.',
      },
      { type: 'h2', text: '¿Cuántos paneles necesitas?' },
      {
        type: 'ul',
        items: [
          'Consumo básico (500 Wh/día): 1-2 paneles de 200 W.',
          'Hogar medio (2-3 kWh/día): 4-6 paneles de 400 W.',
          'Casa completa (5+ kWh/día): 8+ paneles y sistema dimensionado por un técnico.',
        ],
      },
      {
        type: 'p',
        text: 'En Cuba, con 4-5 horas de sol pico diarias, un panel de 400 W genera entre 1.6 y 2 kWh al día en condiciones reales.',
      },
      { type: 'h2', text: 'Errores comunes al comprar' },
      {
        type: 'ul',
        items: [
          'Comprar paneles sin verificar la compatibilidad con el inversor o la estación.',
          'Ignorar la orientación e inclinación: mal instalado, un panel rinde un 30% menos.',
          'No prever la expansión: elige sistemas a los que puedas añadir paneles o baterías después.',
        ],
      },
      {
        type: 'p',
        text: 'En ElectroMarketCuba te asesoramos para dimensionar tu sistema según tu consumo real, con paneles, estaciones de energía y accesorios con garantía y entrega en La Habana.',
      },
      { type: 'cta', href: '/categorias/e21e251e-2cc0-418c-8e5f-69940d15167e', label: 'Ver soluciones de energía solar →' },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/**
 * Presentación de las categorías en el frontend.
 *
 * Las categorías se crean y editan desde el CMS, así que no hay un conjunto fijo
 * de slugs ni de etiquetas: las etiquetas vienen del API (en el payload del post
 * y en `GET /categories`). Aquí solo viven (a) el color del badge, que es ESTABLE
 * por slug para que una categoría siempre tenga el mismo color, y (b) el mapeo de
 * los slugs de la taxonomía antigua por compatibilidad de URLs.
 */
export type MainCategoryValue = string;

const FALLBACK_COLOR = 'border-accent/50 bg-accent/10 text-accent';

/** Cadenas literales a propósito: Tailwind solo genera las clases que encuentra escritas. */
const PALETTE = [
  'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  'border-cyan-400/50 bg-cyan-400/10 text-cyan-300',
  'border-amber-400/50 bg-amber-400/10 text-amber-300',
  'border-violet-400/50 bg-violet-400/10 text-violet-300',
  'border-blue-400/50 bg-blue-400/10 text-blue-300',
  'border-rose-400/50 bg-rose-400/10 text-rose-300',
  'border-green-400/50 bg-green-400/10 text-green-300',
  'border-teal-400/50 bg-teal-400/10 text-teal-300',
  'border-orange-400/50 bg-orange-400/10 text-orange-300',
  'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300',
];

/** Las 4 categorías por defecto conservan su color original. */
const DEFAULT_COLOR: Record<string, string> = {
  SOFTWARE_DEV: PALETTE[0],
  INFRA_HOMELAB: PALETTE[1],
  IT_HARDWARE: PALETTE[2],
  IA_TECH: PALETTE[3],
};

/**
 * Color del badge para un slug de categoría. Estable: el mismo slug siempre da el
 * mismo color; las categorías creadas por el usuario se reparten la paleta.
 */
export function categoryColor(slug: string): string {
  if (!slug) return FALLBACK_COLOR;
  const fixed = DEFAULT_COLOR[slug];
  if (fixed) return fixed;

  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * Slug de la taxonomía plana anterior → slug de la categoría nueva.
 * Replica `LEGACY_CATEGORY_SLUG_MAP` del API para parsear las URLs del blog.
 */
export const LEGACY_CATEGORY_SLUG_MAP: Record<string, MainCategoryValue> = {
  desarrollo: 'SOFTWARE_DEV',
  infraestructura: 'INFRA_HOMELAB',
  homelab: 'INFRA_HOMELAB',
  redes: 'INFRA_HOMELAB',
  hardware: 'IT_HARDWARE',
  'soporte-ti': 'IT_HARDWARE',
  ia: 'IA_TECH',
};

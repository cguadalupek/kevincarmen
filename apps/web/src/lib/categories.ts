/**
 * Presentación de las categorías en el frontend.
 *
 * Las categorías se crean y editan desde el CMS: las etiquetas vienen del API.
 * Aquí viven (a) la PALETA de colores entre la que el usuario elige al crear una
 * categoría (`color` guardado en la BD es la clave de esta paleta), y (b) el
 * mapeo de los slugs de la taxonomía antigua por compatibilidad de URLs.
 */
export type MainCategoryValue = string;

export interface CategoryColorOption {
  key: string;
  label: string;
  /** Cadenas literales a propósito: Tailwind solo genera las clases que encuentra escritas. */
  classes: string;
}

/** Paleta completa de colores de categoría. La clave es lo que se guarda en la BD. */
export const CATEGORY_COLORS: CategoryColorOption[] = [
  {
    key: 'emerald',
    label: 'Esmeralda',
    classes: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  },
  { key: 'cyan', label: 'Cian', classes: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300' },
  { key: 'amber', label: 'Ámbar', classes: 'border-amber-400/50 bg-amber-400/10 text-amber-300' },
  {
    key: 'violet',
    label: 'Violeta',
    classes: 'border-violet-400/50 bg-violet-400/10 text-violet-300',
  },
  { key: 'blue', label: 'Azul', classes: 'border-blue-400/50 bg-blue-400/10 text-blue-300' },
  { key: 'rose', label: 'Rosa', classes: 'border-rose-400/50 bg-rose-400/10 text-rose-300' },
  { key: 'green', label: 'Verde', classes: 'border-green-400/50 bg-green-400/10 text-green-300' },
  {
    key: 'teal',
    label: 'Verde azulado',
    classes: 'border-teal-400/50 bg-teal-400/10 text-teal-300',
  },
  {
    key: 'orange',
    label: 'Naranja',
    classes: 'border-orange-400/50 bg-orange-400/10 text-orange-300',
  },
  {
    key: 'fuchsia',
    label: 'Fucsia',
    classes: 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300',
  },
];

const FALLBACK_COLOR = 'border-accent/50 bg-accent/10 text-accent';

const COLOR_BY_KEY = new Map(CATEGORY_COLORS.map((c) => [c.key, c.classes]));

/** Clases del badge para una clave de color de la paleta. */
export function categoryColorClass(color?: string | null): string {
  if (!color) return FALLBACK_COLOR;
  return COLOR_BY_KEY.get(color) ?? FALLBACK_COLOR;
}

/**
 * Respaldo por slug (cuando la categoría no trae color). Estable: el mismo slug
 * siempre da el mismo color.
 */
export function categoryColor(slug: string): string {
  if (!slug) return FALLBACK_COLOR;

  const classes = CATEGORY_COLORS.map((c) => c.classes);
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return classes[hash % classes.length];
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

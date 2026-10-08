/**
 * Valores válidos de `Post.mainCategory`. Duplica el enum `MainCategory` de
 * Prisma — el backend es la única autoridad de los valores; este tipo solo
 * permite compilar sin depender del paquete compartido. Se re-exporta desde
 * lib/api/categories.ts y lib/api/posts.ts.
 */
export type MainCategoryValue = 'SOFTWARE_DEV' | 'INFRA_HOMELAB' | 'IT_HARDWARE' | 'IA_TECH';

/**
 * Etiquetas, orden y colores de las 4 categorías principales.
 *
 * Tiene que seguir en sincronía con el enum `MainCategory` de Prisma y con
 * `apps/api/src/categories/taxonomy.ts`, que es quien sirve las etiquetas en
 * `GET /categories`. Aquí se repiten porque un badge tiene que pintarse aunque
 * la llamada al API falle.
 */
export const MAIN_CATEGORY_ORDER: MainCategoryValue[] = [
  'SOFTWARE_DEV',
  'INFRA_HOMELAB',
  'IT_HARDWARE',
  'IA_TECH',
];

export const MAIN_CATEGORY_LABELS: Record<MainCategoryValue, string> = {
  SOFTWARE_DEV: 'Software & Dev',
  INFRA_HOMELAB: 'Infra & Homelab',
  IT_HARDWARE: 'IT & Hardware',
  IA_TECH: 'IA & Tech',
};

/**
 * Clases de Tailwind por categoría. Son cadenas estáticas a propósito: Tailwind
 * solo genera las clases que encuentra escritas en el código, por eso no se
 * construyen concatenando el nombre del color.
 */
export const MAIN_CATEGORY_COLORS: Record<MainCategoryValue, string> = {
  SOFTWARE_DEV: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  INFRA_HOMELAB: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300',
  IT_HARDWARE: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
  IA_TECH: 'border-violet-400/50 bg-violet-400/10 text-violet-300',
};

const FALLBACK_COLOR = 'border-accent/50 bg-accent/10 text-accent';

export function categoryLabel(value: MainCategoryValue): string {
  return MAIN_CATEGORY_LABELS[value] ?? value;
}

export function categoryColor(value: MainCategoryValue): string {
  return MAIN_CATEGORY_COLORS[value] ?? FALLBACK_COLOR;
}

/**
 * `?categoria=` sigue aceptando los slugs de la taxonomía plana anterior para no
 * romper los enlaces ya publicados; esta tabla replica la del API
 * (`LEGACY_CATEGORY_SLUG_MAP`).
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

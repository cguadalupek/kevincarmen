/**
 * Datos semilla y mapeos de la taxonomía de categorías.
 *
 * Las categorías ahora son una TABLA editable desde el CMS (`main_categories`);
 * aquí solo viven: (a) las 4 categorías por defecto con las que se siembra una BD
 * nueva (también van en la migración inicial), y (b) la traducción de los slugs de
 * la taxonomía antigua (plana) a la nueva, para no romper enlaces ya publicados.
 */

export interface MainCategorySeed {
  slug: string;
  name: string;
  description: string;
  position: number;
}

export const DEFAULT_CATEGORIES: MainCategorySeed[] = [
  {
    slug: 'SOFTWARE_DEV',
    name: 'Software & Dev',
    description: 'Desarrollo de software, código, arquitectura y proyectos.',
    position: 1,
  },
  {
    slug: 'INFRA_HOMELAB',
    name: 'Infra & Homelab',
    description: 'Servidores, contenedores, despliegues, redes y seguridad.',
    position: 2,
  },
  {
    slug: 'IT_HARDWARE',
    name: 'IT & Hardware',
    description: 'Equipos, ensamblaje, mantenimiento y cableado.',
    position: 3,
  },
  {
    slug: 'IA_TECH',
    name: 'IA & Tech',
    description: 'IA local, herramientas de IA y experimentos.',
    position: 4,
  },
];

/**
 * Slug de la taxonomía plana anterior → slug de la categoría nueva.
 * El frontend clásico usaba `?category=<slug>` con estos valores; el filtro del
 * listado sigue aceptándolos aunque en la BD ya no existan.
 */
export const LEGACY_CATEGORY_SLUG_MAP: Record<string, string> = {
  desarrollo: 'SOFTWARE_DEV',
  infraestructura: 'INFRA_HOMELAB',
  homelab: 'INFRA_HOMELAB',
  redes: 'INFRA_HOMELAB',
  hardware: 'IT_HARDWARE',
  'soporte-ti': 'IT_HARDWARE',
  ia: 'IA_TECH',
};

/**
 * Normaliza un valor del query param `category` a un slug de categoría nueva:
 * deja pasar el slug tal cual (incluye categorías creadas por el usuario) y
 * traduce los slugs antiguos. Devuelve `undefined` si el valor no es reconocido
 * (filtro inválido → el listado debe quedar vacío, no "todo").
 */
export function normalizeCategorySlug(value?: string | null): string | undefined {
  if (!value) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;

  return LEGACY_CATEGORY_SLUG_MAP[normalized.toLowerCase()] ?? normalized;
}

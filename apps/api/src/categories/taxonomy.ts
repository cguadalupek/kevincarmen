import { MainCategory } from '@prisma/client';

export interface MainCategoryMeta {
  value: MainCategory;
  label: string;
  description: string;
  position: number;
}

/**
 * Etiquetas, descripciones y orden de las 4 categorías principales.
 *
 * Esta lista tiene que seguir en sincronía con el enum `MainCategory` del
 * schema.prisma. Si agregas un valor al enum, agrégalo también aquí y en
 * `apps/web/src/lib/categories.ts` (el frontend necesita además los colores de
 * los badges). Son tres sitios porque el monorepo no tiene un paquete compartido
 * compilable —`@kevincarmen/types` se publica como fuente TypeScript y NestJS,
 * que no bundlea, no puede importarlo en runtime—.
 */
export const MAIN_CATEGORY_META: Record<MainCategory, MainCategoryMeta> = {
  SOFTWARE_DEV: {
    value: 'SOFTWARE_DEV',
    label: 'Software & Dev',
    description: 'Desarrollo de software, arquitectura, proyectos y guías de código.',
    position: 1,
  },
  INFRA_HOMELAB: {
    value: 'INFRA_HOMELAB',
    label: 'Infra & Homelab',
    description: 'Servidores, contenedores, despliegues, redes y seguridad.',
    position: 2,
  },
  IT_HARDWARE: {
    value: 'IT_HARDWARE',
    label: 'IT & Hardware',
    description: 'Equipos, ensamblaje, mantenimiento y cableado.',
    position: 3,
  },
  IA_TECH: {
    value: 'IA_TECH',
    label: 'IA & Tech',
    description: 'IA local, herramientas, automatización y experimentos.',
    position: 4,
  },
};

/** Las 4 categorías principales en su orden de presentación. */
export const MAIN_CATEGORY_ORDER: MainCategoryMeta[] = Object.values(
  MAIN_CATEGORY_META,
).sort((a, b) => a.position - b.position);

/**
 * Taxonomía plana anterior → categoría principal nueva.
 *
 * Sirve para dos cosas: migrar filas que ya existan con esos slugs y, sobre todo,
 * que los enlaces ya publicados (`/blog?categoria=redes`) sigan resolviendo a algo
 * en lugar de devolver una lista vacía después del cambio.
 */
export const LEGACY_CATEGORY_SLUG_MAP: Record<string, MainCategory> = {
  desarrollo: 'SOFTWARE_DEV',
  infraestructura: 'INFRA_HOMELAB',
  homelab: 'INFRA_HOMELAB',
  redes: 'INFRA_HOMELAB',
  hardware: 'IT_HARDWARE',
  'soporte-ti': 'IT_HARDWARE',
  ia: 'IA_TECH',
};

export function isMainCategory(value: string): value is MainCategory {
  return Object.prototype.hasOwnProperty.call(MAIN_CATEGORY_META, value);
}

/**
 * Normaliza el query param `category`: acepta tanto el valor del enum
 * (`INFRA_HOMELAB`) como un slug antiguo (`infraestructura`, `redes`, ...).
 * Devuelve `undefined` si no reconoce el valor, para que el listado ignore el
 * filtro en lugar de romper.
 */
export function resolveMainCategoryParam(
  value?: string | null,
): MainCategory | undefined {
  if (!value) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;
  if (isMainCategory(normalized)) return normalized;

  return LEGACY_CATEGORY_SLUG_MAP[normalized.toLowerCase()];
}

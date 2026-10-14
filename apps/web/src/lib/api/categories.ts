const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type MainCategoryValue = import('@/lib/categories').MainCategoryValue;

export interface ApiSubcategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
  /** Artículos PUBLICADOS en la subcategoría (píldora del filtro del blog). */
  postsCount?: number;
}

/** Un nodo del árbol que devuelve `GET /categories`. `value` = slug (va en la URL). */
export interface CategoryTreeNode {
  /** Id de la categoría principal (para el payload del CMS). */
  id: string;
  /** Slug de la categoría principal (lo que viaja en ?category=). */
  value: string;
  label: string;
  description: string | null;
  position: number;
  /** Clave de color de la paleta (emerald, cyan, ...). */
  color: string;
  /** Artículos PUBLICADOS en la categoría (píldora del filtro del blog). */
  postsCount?: number;
  subcategories: ApiSubcategory[];
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Árbol de categorías principales → subcategorías. Como las categorías se crean
 * desde el CMS, esto refleja siempre el estado actual.
 *
 * Sirve tanto en componentes de servidor (blog) como en el cliente (formulario y
 * admin). Devuelve `[]` si el API no responde, nunca lanza.
 */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  try {
    const data = await fetchJson(`${API_URL}/categories`);
    return Array.isArray(data) ? (data as CategoryTreeNode[]) : [];
  } catch {
    return [];
  }
}

/** Todas las subcategorías del árbol en una sola lista. */
export function flattenSubcategories(tree: CategoryTreeNode[]): ApiSubcategory[] {
  return tree.flatMap((node) => node.subcategories);
}

/** Subcategorías de una categoría principal concreta (por su id). */
export function subcategoriesOf(
  tree: CategoryTreeNode[],
  mainCategoryId: string | null | undefined,
): ApiSubcategory[] {
  if (!mainCategoryId) return [];
  return tree.find((node) => node.id === mainCategoryId)?.subcategories ?? [];
}

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type MainCategoryValue = import('@/lib/categories').MainCategoryValue;

export interface ApiSubcategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
}

/** Un nodo del árbol que devuelve `GET /categories`. */
export interface CategoryTreeNode {
  value: MainCategoryValue;
  label: string;
  description: string;
  position: number;
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
 * Árbol de categorías principales → subcategorías.
 *
 * Sirve tanto en componentes de servidor (la página del blog) como en el cliente
 * (el formulario del CMS): con `API_INTERNAL_URL` resuelve server-side dentro de
 * la red de Docker y con la ruta relativa `/api/v1` funciona desde el navegador
 * a través de nginx.
 *
 * Devuelve `[]` si el API no responde, nunca lanza: el listado público debe
 * seguir renderizando aunque falle la taxonomía.
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

/** Subcategorías de una principal concreta. */
export function subcategoriesOf(
  tree: CategoryTreeNode[],
  mainCategory: MainCategoryValue | null | undefined,
): ApiSubcategory[] {
  if (!mainCategory) return [];
  return tree.find((node) => node.value === mainCategory)?.subcategories ?? [];
}

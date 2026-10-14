'use client';

import { useMemo } from 'react';
import { FolderTree, Tags } from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/api/categories';
import { FilterList, type FilterOption } from '@/components/ui/filter-list';

/**
 * Sentinelas de la fila correspondiente:
 * `ALL_CATEGORIES` = sin categoría elegida (las subcategorías quedan sin opciones),
 * `ALL_SUBCATEGORIES` = todas las subcategorías de la categoría activa.
 */
export const ALL_CATEGORIES = 'todos';
export const ALL_SUBCATEGORIES = 'todas';

interface CategoryFilterProps {
  /** Árbol principal → subcategorías que devuelve el API (con `postsCount`). */
  categories: CategoryTreeNode[];
  /** Slug de la categoría activa, o `ALL_CATEGORIES` (`"todos"`). */
  selectedCategory: string;
  /** Slug de la subcategoría activa, o `ALL_SUBCATEGORIES` (`"todas"`). */
  selectedSubcategory: string;
  /** Se dispara al elegir categoría, para pintar el activo sin esperar la navegación. */
  onSelectCategory?: (slug: string) => void;
  /** Se dispara al elegir subcategoría. */
  onSelectSubcategory?: (slug: string) => void;
  className?: string;
}

/**
 * Filtro del blog: DOS listas estructuradas, la misma que usan Proyectos, Lab y
 * Recursos (`components/ui/filter-list`).
 *
 * - «Categoría»: todas las categorías principales con su número de artículos.
 * - «Subcategoría»: la segunda lista, con las subcategorías de la categoría activa.
 *   Se mantiene la jerarquía (no son una lista plana): sin categoría elegida la lista
 *   queda deshabilitada con la pista «Elige una categoría».
 *
 * Cada fila es un `<Link>`: la URL (`?categoria=&subcategoria=`) sigue siendo la
 * fuente de verdad — el API filtra del lado del servidor y los enlaces quedan
 * indexables. Los callbacks existen sólo para el realce optimista mientras navega.
 */
export function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  className = '',
}: CategoryFilterProps) {
  /**
   * Orden de la lista = el que se configura en /admin/categorias (`position` ascendente).
   * El API ya lo devuelve ordenado; se ordena también aquí para que la garantía viva en
   * el propio componente y no dependa del transporte.
   *
   * «Todas» NO es una categoría de la BD: es la opción fija que pinta `FilterList`.
   */
  const orderedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.label.localeCompare(b.label, 'es'),
      ),
    [categories],
  );

  const activeCategory =
    orderedCategories.find((category) => category.value === selectedCategory) ?? null;
  const subcategories = activeCategory?.subcategories ?? [];

  /** Artículos publicados de todas las categorías (píldora de «Todas las categorías»). */
  const totalPosts = useMemo(
    () => orderedCategories.reduce((acc, category) => acc + (category.postsCount ?? 0), 0),
    [orderedCategories],
  );

  const categoryOptions: FilterOption[] = orderedCategories.map((category) => ({
    value: category.value,
    label: category.label,
    count: category.postsCount ?? 0,
    href: `/blog?categoria=${encodeURIComponent(category.value)}`,
  }));

  const subcategoryOptions: FilterOption[] = activeCategory
    ? subcategories.map((subcategory) => ({
        value: subcategory.slug,
        label: subcategory.name,
        count: subcategory.postsCount ?? 0,
        href: `/blog?categoria=${encodeURIComponent(
          activeCategory.value,
        )}&subcategoria=${encodeURIComponent(subcategory.slug)}`,
      }))
    : [];

  const currentSubcategory =
    selectedSubcategory && selectedSubcategory !== ALL_SUBCATEGORIES ? selectedSubcategory : ALL_SUBCATEGORIES;

  return (
    <div className={`grid w-full gap-4 sm:grid-cols-2 ${className}`}>
      <FilterList
        label="Categoría"
        icon={<FolderTree className="h-3.5 w-3.5" />}
        value={activeCategory?.value ?? ALL_CATEGORIES}
        allValue={ALL_CATEGORIES}
        allLabel="Todas las categorías"
        allCount={totalPosts}
        options={categoryOptions}
        onSelect={(value) => onSelectCategory?.(value)}
      />

      {/*
        Segunda lista, independiente y colgando de la categoría activa: sin categoría
        elegida queda deshabilitada (no hay subcategorías que ofrecer todavía).
      */}
      <FilterList
        label="Subcategoría"
        icon={<Tags className="h-3.5 w-3.5" />}
        value={currentSubcategory}
        allValue={ALL_SUBCATEGORIES}
        allLabel="Todas las subcategorías"
        allCount={activeCategory?.postsCount ?? 0}
        options={subcategoryOptions}
        onSelect={(value) => onSelectSubcategory?.(value)}
        disabled={!activeCategory}
        emptyLabel="Elige una categoría"
      />
    </div>
  );
}

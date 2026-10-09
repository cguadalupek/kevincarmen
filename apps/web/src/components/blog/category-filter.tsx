'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CategoryTreeNode } from '@/lib/api/categories';

/**
 * Sentinelas de la fila correspondiente:
 * `ALL_CATEGORIES` = sin categoría elegida (se oculta la fila de subcategorías),
 * `ALL_SUBCATEGORIES` = todas las subcategorías de la categoría activa.
 */
export const ALL_CATEGORIES = 'todos';
export const ALL_SUBCATEGORIES = 'todas';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0';

/** Botón de categoría principal: pegado al resto (sin gap), separado por su borde izquierdo. */
const CATEGORY_BUTTON = `shrink-0 whitespace-nowrap rounded-none border-b-2 border-l px-4 py-2.5 text-sm font-medium transition-colors first:border-l-0 ${FOCUS_RING}`;
const CATEGORY_ACTIVE = 'border-b-accent border-l-slate-800 bg-accent/15 text-accent';
const CATEGORY_IDLE =
  'border-b-slate-800 border-l-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200';

/**
 * Botón de subcategoría: mismo alto casi que el de categoría (como en la maqueta),
 * pero sobre una banda gris clara que separa visualmente los dos niveles.
 */
const SUB_BUTTON = `shrink-0 whitespace-nowrap rounded-none border-b-2 border-l px-4 py-2.5 text-xs font-medium transition-colors first:border-l-0 ${FOCUS_RING}`;
const SUB_ACTIVE = 'border-b-accent border-l-slate-800 bg-accent/20 text-accent';
const SUB_IDLE =
  'border-b-slate-800 border-l-slate-800 bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white';

/**
 * Degradado de la derecha: pista de que la fila se puede deslizar. El color de
 * origen debe ser el fondo REAL de la fila (no `slate-950` en las dos), o sobre la
 * banda clara de subcategorías se ve una mancha oscura.
 */
const SCROLL_FADE_BASE =
  'pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent';
const SCROLL_FADE_ON_DARK = `${SCROLL_FADE_BASE} from-slate-950`;
const SCROLL_FADE_ON_LIGHT = `${SCROLL_FADE_BASE} from-slate-700`;

interface CategoryFilterProps {
  /** Árbol principal → subcategorías que devuelve el API. */
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
 * Filtro de categorías y subcategorías del blog.
 *
 * Cada botón es un `<Link>`: la URL (`?categoria=&subcategoria=`) sigue siendo la
 * fuente de verdad — el API filtra del lado del servidor y los enlaces quedan
 * indexables/compartibles. Los callbacks existen sólo para el realce optimista del
 * botón activo mientras la navegación termina.
 *
 * Responsive: en móvil ambas filas son carruseles horizontales de una sola línea
 * (`overflow-x-auto no-scrollbar`) pegadas verticalmente, con un degradado a la
 * derecha que se apaga al llegar al final; en escritorio la fila de categorías
 * ocupa el ancho completo en una sola línea.
 *
 * Los bordes que separan los botones se declaran POR LADO: `border-l-slate-800`
 * entre botones y `border-b-2` (slate-800 en reposo, el acento del tema en el
 * activo) como línea inferior de la fila. No usar `divide-slate-800`:
 * `divide-<color>` escribe el `border-color` completo sobre los hermanos con
 * especificidad (0,3,0) y anularía el subrayado del activo; y `border-transparent`
 * (atajo de los 4 lados) borraría el separador interno.
 *
 * El color activo sale del token del tema (`--accent`, cian) y no de `sky-*`: en el
 * sitio ya hay un solo azul y el filtro no debe introducir un segundo.
 */
export function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  className = '',
}: CategoryFilterProps) {
  const activeCategory =
    categories.find((category) => category.value === selectedCategory) ?? null;
  const subcategories = activeCategory?.subcategories ?? [];

  const categoryRow = useScrollableRow(categories.length);
  const subcategoryRow = useScrollableRow(`${selectedCategory}:${subcategories.length}`);

  return (
    <div className={`flex w-full flex-col ${className}`}>
      {/* Bloque único: filas pegadas, separadas sólo por el borde interno. */}
      <div className="flex w-full flex-col overflow-hidden rounded-none border border-slate-800 bg-slate-950">
        {/* Fila 1 — categorías principales. */}
        <nav aria-label="Categorías principales" className="relative">
          <div
            ref={categoryRow.ref}
            className="flex overflow-x-auto whitespace-nowrap no-scrollbar"
          >
            <CategoryButton
              href="/blog"
              label="Todos"
              isActive={activeCategory === null}
              onClick={() => onSelectCategory?.(ALL_CATEGORIES)}
            />
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                href={`/blog?categoria=${encodeURIComponent(category.value)}`}
                label={category.label}
                isActive={activeCategory?.value === category.value}
                onClick={() => onSelectCategory?.(category.value)}
              />
            ))}
          </div>
          {categoryRow.showFade && <span aria-hidden className={SCROLL_FADE_ON_DARK} />}
        </nav>

        {/* Fila 2 — subcategorías: sólo cuando hay una principal elegida. */}
        {activeCategory && subcategories.length > 0 && (
          <nav aria-label={`Subcategorías de ${activeCategory.label}`} className="relative">
            <div
              ref={subcategoryRow.ref}
              className="flex overflow-x-auto whitespace-nowrap no-scrollbar"
            >
              <SubcategoryButton
                href={`/blog?categoria=${encodeURIComponent(activeCategory.value)}`}
                label="Todas"
                isActive={!selectedSubcategory || selectedSubcategory === ALL_SUBCATEGORIES}
                onClick={() => onSelectSubcategory?.(ALL_SUBCATEGORIES)}
              />
              {subcategories.map((subcategory) => (
                <SubcategoryButton
                  key={subcategory.id}
                  href={`/blog?categoria=${encodeURIComponent(
                    activeCategory.value,
                  )}&subcategoria=${encodeURIComponent(subcategory.slug)}`}
                  label={subcategory.name}
                  isActive={selectedSubcategory === subcategory.slug}
                  onClick={() => onSelectSubcategory?.(subcategory.slug)}
                />
              ))}
            </div>
            {subcategoryRow.showFade && <span aria-hidden className={SCROLL_FADE_ON_LIGHT} />}
          </nav>
        )}
      </div>
    </div>
  );
}

function CategoryButton({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`${CATEGORY_BUTTON} ${isActive ? CATEGORY_ACTIVE : CATEGORY_IDLE}`}
    >
      {label}
    </Link>
  );
}

function SubcategoryButton({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`${SUB_BUTTON} ${isActive ? SUB_ACTIVE : SUB_IDLE}`}
    >
      {label}
    </Link>
  );
}

/**
 * Sigue el scroll de una fila para saber si desborda y si el usuario ya llegó al
 * final, y vuelve al inicio cuando cambia su contenido (al cambiar de categoría).
 */
function useScrollableRow(dependency: string | number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState({ scrollable: false, atEnd: true });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const maxScroll = element.scrollWidth - element.clientWidth;
      setState({ scrollable: maxScroll > 1, atEnd: element.scrollLeft >= maxScroll - 1 });
    };

    // Contenido nuevo (otra categoría): la fila arranca desde el principio.
    element.scrollLeft = 0;
    update();

    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [dependency]);

  return { ref, showFade: state.scrollable && !state.atEnd };
}

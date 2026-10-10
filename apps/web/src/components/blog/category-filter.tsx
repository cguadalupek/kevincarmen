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

/** Anillo de foco hacia adentro: fuera se recortaría contra el borde de la fila. */
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';

/**
 * Fichas sueltas: cada botón lleva su propio borde (no hay marco alrededor del
 * bloque, como en la maqueta) y en escritorio se reparten el ancho de la fila.
 */
const BUTTON_BASE =
  `shrink-0 whitespace-nowrap rounded-md border px-4 py-2.5 text-center font-medium transition-colors md:flex-1 ${FOCUS_RING}`;

const CATEGORY_BUTTON = `${BUTTON_BASE} text-sm`;
const CATEGORY_ACTIVE = 'border-accent bg-accent/15 text-accent';
const CATEGORY_IDLE =
  'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200';

/** Subcategoría: mismo alto casi que la categoría, sobre una banda gris más clara. */
const SUB_BUTTON = `${BUTTON_BASE} text-xs`;
const SUB_ACTIVE = 'border-accent bg-accent/20 text-accent';
const SUB_IDLE = 'border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white';

/**
 * Pista de scroll: máscara sobre la fila, no un degradado de color encima. Así
 * funciona igual sobre los botones oscuros y sobre la banda clara, sin arrastrar
 * el color de fondo de cada fila.
 */
const FADE_MASK =
  '[mask-image:linear-gradient(to_left,transparent_0,#000_3rem)] [-webkit-mask-image:linear-gradient(to_left,transparent_0,#000_3rem)]';

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
 * (`overflow-x-auto no-scrollbar`) con la máscara de la derecha como pista de que
 * se puede deslizar; en escritorio los botones se reparten el ancho completo.
 *
 * El color activo sale del token del tema (`--accent`): en el sitio ya hay un solo
 * azul y el filtro no debe introducir un segundo.
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
    <div className={`flex w-full flex-col gap-1 ${className}`}>
      {/* Fila 1 — categorías principales. */}
      <nav aria-label="Categorías principales">
        <div
          ref={categoryRow.ref}
          className={`flex gap-px overflow-x-auto whitespace-nowrap no-scrollbar ${
            categoryRow.showFade ? FADE_MASK : ''
          }`}
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
      </nav>

      {/* Fila 2 — subcategorías: sólo cuando hay una principal elegida. */}
      {activeCategory && subcategories.length > 0 && (
        <nav aria-label={`Subcategorías de ${activeCategory.label}`}>
          <div
            ref={subcategoryRow.ref}
            className={`flex gap-px overflow-x-auto whitespace-nowrap no-scrollbar ${
              subcategoryRow.showFade ? FADE_MASK : ''
            }`}
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
        </nav>
      )}
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
 * Sigue el scroll de una fila para saber si desborda (y por lo tanto si hay que
 * mostrar la máscara de la derecha), y vuelve al inicio cuando cambia su contenido
 * (al cambiar de categoría).
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
    // El ancho del CONTENIDO cambia al cargar la tipografía web (o al cambiar los
    // rótulos) sin mover la caja de la fila: observando sólo la fila, el aviso de
    // scroll se quedaba apagado. Los hijos delatan esos cambios.
    for (const child of Array.from(element.children)) observer.observe(child);
    document.fonts?.ready.then(update).catch(() => {});

    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [dependency]);

  return { ref, showFade: state.scrollable && !state.atEnd };
}

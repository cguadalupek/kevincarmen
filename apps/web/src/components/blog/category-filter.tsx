'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CategoryTreeNode } from '@/lib/api/categories';

/**
 * Sentinelas de la fila correspondiente:
 * `ALL_CATEGORIES` = sin categoría elegida (se oculta el mapa de subcategorías),
 * `ALL_SUBCATEGORIES` = todas las subcategorías de la categoría activa.
 */
export const ALL_CATEGORIES = 'todos';
export const ALL_SUBCATEGORIES = 'todas';

/** Anillo de foco hacia adentro: hacia afuera se recortaría contra el borde de la fila. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';

/** Ficha base. Las de categoría además se reparten el ancho de la fila en escritorio. */
const BUTTON_BASE =
  `shrink-0 whitespace-nowrap rounded-md border px-4 py-2.5 font-medium transition-colors ${FOCUS_RING}`;

const CATEGORY_BUTTON = `${BUTTON_BASE} text-center text-sm md:flex-1`;
const CATEGORY_ACTIVE = 'border-accent bg-accent/15 text-accent';
const CATEGORY_IDLE =
  'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200';

/** Ficha de subcategoría: va dentro del mapa, así que no se estira. */
const SUB_BUTTON = `${BUTTON_BASE} text-xs`;
const SUB_ACTIVE = 'border-accent bg-accent/20 text-accent';
const SUB_IDLE = 'border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white';

/**
 * Pista de scroll de la fila de categorías: máscara sobre la fila, no un degradado de
 * color encima, así funciona igual sobre fichas claras y oscuras.
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
 * Fila de categorías: una sola línea de fichas; en móvil se desliza en horizontal
 * (con la máscara de la derecha como pista) y en escritorio se reparten el ancho.
 *
 * Subcategorías: al elegir una categoría se despliega un **mapa sinóptico**: el nombre
 * de la categoría, un conector y una llave dibujada que se estira a la altura exacta de
 * la lista. La llave es SVG con `preserveAspectRatio="none"`, así que sigue pegada a la
 * lista sin importar cuántas subcategorías haya.
 *
 * Cada botón es un `<Link>`: la URL (`?categoria=&subcategoria=`) sigue siendo la fuente
 * de verdad — el API filtra del lado del servidor y los enlaces quedan indexables. Los
 * callbacks existen sólo para el realce optimista mientras termina la navegación.
 *
 * El color activo sale del token del tema (`--accent`): en el sitio ya hay un solo azul y
 * el filtro no debe introducir un segundo.
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

      {/* Mapa sinóptico — sólo con una categoría elegida. */}
      {activeCategory && subcategories.length > 0 && (
        <nav
          aria-label={`Subcategorías de ${activeCategory.label}`}
          className="flex items-stretch gap-2 md:gap-3"
        >
          <span className="self-center whitespace-nowrap text-sm font-semibold text-accent">
            {activeCategory.label}
          </span>
          <span aria-hidden className="h-px w-6 shrink-0 self-center bg-slate-500" />
          <Brace />
          <ul role="list" className="flex min-w-0 flex-col items-start gap-1">
            <li>
              <SubcategoryButton
                href={`/blog?categoria=${encodeURIComponent(activeCategory.value)}`}
                label="Todas"
                isActive={!selectedSubcategory || selectedSubcategory === ALL_SUBCATEGORIES}
                onClick={() => onSelectSubcategory?.(ALL_SUBCATEGORIES)}
              />
            </li>
            {subcategories.map((subcategory) => (
              <li key={subcategory.id}>
                <SubcategoryButton
                  href={`/blog?categoria=${encodeURIComponent(
                    activeCategory.value,
                  )}&subcategoria=${encodeURIComponent(subcategory.slug)}`}
                  label={subcategory.name}
                  isActive={selectedSubcategory === subcategory.slug}
                  onClick={() => onSelectSubcategory?.(subcategory.slug)}
                />
              </li>
            ))}
          </ul>
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
 * Llave del mapa. Se estira a la altura de la lista (`preserveAspectRatio="none"` +
 * `self-stretch`) con el trazo de ancho constante (`non-scaling-stroke`), así no se
 * deforma por más larga que sea la lista. El trazo va de borde a borde del viewBox
 * (0 → 100) para que las puntas coincidan con la primera y la última ficha.
 */
function Brace() {
  return (
    <svg
      aria-hidden
      viewBox="-1 -1 22 102"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      vectorEffect="non-scaling-stroke"
      className="w-3.5 shrink-0 self-stretch text-slate-500"
    >
      <path d="M18,0 C7,0 15,44 6,50 C15,56 7,100 18,100" />
    </svg>
  );
}

/**
 * Sigue el scroll de una fila para saber si desborda (y por lo tanto si hay que mostrar
 * la máscara de la derecha), y vuelve al inicio cuando cambia su contenido.
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

    // Contenido nuevo: la fila arranca desde el principio.
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

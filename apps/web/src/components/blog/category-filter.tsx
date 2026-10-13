'use client';

import { CSSProperties, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { CategoryTreeNode } from '@/lib/api/categories';

/**
 * Sentinelas de la fila correspondiente:
 * `ALL_CATEGORIES` = sin categoría elegida (se oculta la llave y las subcategorías),
 * `ALL_SUBCATEGORIES` = todas las subcategorías de la categoría activa.
 */
export const ALL_CATEGORIES = 'todos';
export const ALL_SUBCATEGORIES = 'todas';

/** Anillo de foco hacia adentro: hacia afuera se recortaría contra el borde de la fila. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';

/** Ficha base. En escritorio se reparten el ancho de su fila. */
const BUTTON_BASE =
  `shrink-0 whitespace-nowrap rounded-md border px-4 py-2.5 text-center font-medium transition-colors ${FOCUS_RING}`;

const CATEGORY_BUTTON = `${BUTTON_BASE} text-sm md:flex-1`;
const CATEGORY_ACTIVE = 'border-accent bg-accent/15 text-accent';
const CATEGORY_IDLE =
  'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200';

// `flex-1` sin condicionar: con las filas envueltas en móvil, cada línea se reparte el
// ancho completo y los extremos de la llave quedan alineados con las fichas.
const SUB_BUTTON = `${BUTTON_BASE} flex-1 text-xs`;
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
 * Fila de categorías: una sola línea de fichas; en móvil se desliza en horizontal (con
 * la máscara de la derecha como pista) y en escritorio se reparten el ancho.
 *
 * Subcategorías: al elegir una categoría cuelga una **llave horizontal** debajo de la
 * fila, con la punta apuntando a la ficha activa, y las subcategorías van en fila debajo
 * de la llave. La llave son dos mitades SVG (`preserveAspectRatio="none"`), una espejada:
 * el punto donde se juntan es la punta, y se ubica midiendo el centro de la ficha activa,
 * así sigue a la categoría sin importar lo que se deslice la fila.
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

  /**
   * Orden de la fila = el que se configura en /admin/categorias (`position` ascendente).
   * El API ya lo devuelve ordenado; se ordena también aquí para que la garantía viva en
   * el propio componente y no dependa del transporte.
   *
   * «Todos» NO es una categoría de la BD: es una ficha fija que se pinta en el índice 0,
   * antes de este array.
   */
  const orderedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.label.localeCompare(b.label, 'es'),
      ),
    [categories],
  );

  const categoryRow = useScrollableRow(orderedCategories.length);
  const brace = useBraceAnchor(categoryRow.ref, activeCategory?.value ?? null);

  return (
    <div className={`flex w-full flex-col ${className}`}>
      {/* Fila de categorías. */}
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
          {orderedCategories.map((category) => (
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

      {/* Llave colgando de la categoría activa + subcategorías. */}
      {activeCategory && subcategories.length > 0 && (
        <nav aria-label={`Subcategorías de ${activeCategory.label}`} className="flex flex-col">
          <div ref={brace.rowRef} className="w-full">
            <Brace ratio={brace.ratio} />
          </div>

          <ul role="list" className="mt-1 flex w-full flex-wrap gap-1">
            <li className="flex flex-1">
              <SubcategoryButton
                href={`/blog?categoria=${encodeURIComponent(activeCategory.value)}`}
                label="Todas"
                isActive={!selectedSubcategory || selectedSubcategory === ALL_SUBCATEGORIES}
                onClick={() => onSelectSubcategory?.(ALL_SUBCATEGORIES)}
              />
            </li>
            {subcategories.map((subcategory) => (
              <li key={subcategory.id} className="flex flex-1">
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
      className={`${SUB_BUTTON} w-full ${isActive ? SUB_ACTIVE : SUB_IDLE}`}
    >
      {label}
    </Link>
  );
}

/**
 * Llave horizontal colgando de la categoría activa.
 *
 * Los codos y la punta son piezas de tamaño FIJO: si se estira un solo path con
 * `preserveAspectRatio="none"` sobre un ancho grande, los codos se aplanan y la llave se
 * lee como una línea suave. Acá sólo el trazo horizontal es elástico (un borde), así la
 * forma se mantiene igual de ancha que de angosta la pantalla.
 */
function Brace({ ratio }: { ratio: number }) {
  const pct = ratio * 100;
  const line = 'absolute top-[13px] h-0 border-t border-slate-500';
  return (
    <div aria-hidden className="relative h-[26px] w-full">
      {/* trazo horizontal, cortado por la punta */}
      <span className={line} style={{ left: 10, width: `calc(${pct}% - 22px)` }} />
      <span className={line} style={{ left: `calc(${pct}% + 12px)`, right: 10 }} />
      {/* codo izquierdo */}
      <Hook className="absolute bottom-0 left-0" />
      {/* punta: dos mitades espejadas que se juntan en el vértice */}
      <Tip className="absolute top-0" style={{ left: `calc(${pct}% - 12px)` }} />
      <Tip className="absolute top-0 -scale-x-100" style={{ left: `${pct}%` }} />
      {/* codo derecho */}
      <Hook className="absolute bottom-0 right-0 -scale-x-100" />
    </div>
  );
}

/** Codo: sube desde el extremo y entra al trazo horizontal. */
function Hook({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      aria-hidden
      width={10}
      height={13}
      viewBox="0 0 10 13"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={`text-slate-500 ${className}`}
      style={style}
    >
      <path d="M0.75,13 C0.75,6.5 4,0.75 10,0.75" />
    </svg>
  );
}

/** Media punta: del trazo horizontal sube al vértice. */
function Tip({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      aria-hidden
      width={12}
      height={14}
      viewBox="0 0 12 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={`text-slate-500 ${className}`}
      style={style}
    >
      <path d="M0,13 C6,13 11.25,8 11.25,0" />
    </svg>
  );
}

/**
 * Ubica la punta de la llave: mide en qué proporción del ancho de la llave cae el centro
 * de la ficha activa. Se recalcula al cambiar de categoría, al redimensionar y cuando se
 * desliza la fila de categorías (en móvil la ficha activa se mueve con el scroll).
 */
function useBraceAnchor(stripRef: RefObject<HTMLDivElement | null>, activeKey: string | null) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState(0.5);

  useEffect(() => {
    const row = rowRef.current;
    const strip = stripRef.current;
    if (!row || !strip) return;

    const update = () => {
      const chip = strip.querySelector<HTMLElement>('a[aria-current="page"]');
      const bounds = row.getBoundingClientRect();
      if (!chip || !bounds.width) return;
      const chipBounds = chip.getBoundingClientRect();
      const center = (chipBounds.left + chipBounds.right) / 2;
      setRatio(Math.min(0.92, Math.max(0.08, (center - bounds.left) / bounds.width)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    strip.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      strip.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [stripRef, activeKey]);

  return { rowRef, ratio };
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

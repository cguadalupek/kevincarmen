'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ListTree, X } from 'lucide-react';
import { cn } from '@kevincarmen/utils';
import type { TocHeading } from '@/lib/blog/headings';

/** Altura del header fijo (`h-16`) + margen: debe coincidir con `scroll-mt-24` y `top-24`. */
const HEADING_OFFSET = 96;
/** Banda inferior del viewport en la que un encabezado ya no cuenta como "activo". */
const BOTTOM_BAND = 60;
/**
 * Rutas de DETALLE con cuerpo markdown y encabezados navegables: artículo,
 * proyecto y clase de curso. El listado (`/blog`, `/proyectos`, `/cursos`) no
 * monta el FAB ni la hoja porque no pasa el slug.
 */
const DETAIL_ROUTE = /^\/(blog|proyectos|cursos)\/.+/;

/**
 * Punto de corte en el que el índice pasa de hoja móvil (FAB) a columna fija.
 *
 * `lg` es el del artículo (columna de 13 rem junto a la lectura de 768 px).
 * `xl` se usa donde la rejilla de la página ya tiene dos columnas antes (el
 * reproductor de clases: temario + contenido), así que el índice solo cabe
 * como tercera columna en pantallas anchas. Los dos componentes comparten el
 * mismo valor para que NUNCA queden los dos visibles ni ninguno.
 */
export type TocBreakpoint = 'lg' | 'xl';

const ASIDE_BREAKPOINT: Record<TocBreakpoint, string> = {
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
};

/** El botón flotante y su hoja desaparecen justo cuando aparece la columna. */
const HIDE_FROM_BREAKPOINT: Record<TocBreakpoint, string> = {
  lg: 'lg:hidden',
  xl: 'xl:hidden',
};

/**
 * Scrollspy: resalta el encabezado que el usuario está leyendo.
 *
 * `IntersectionObserver` sobre los h2/h3 reales del artículo (los ids los pone
 * el plugin de rehype en el HTML servido, así que los anchors funcionan sin JS).
 * Cuando ninguno está en la banda visible, gana el último que quedó por encima.
 */
export function useActiveHeading(ids: string[]): string | null {
  const key = ids.join('|');
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const list = key ? key.split('|') : [];
    const elements = list
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.set(id, list.indexOf(id));
          else visible.delete(id);
        }

        if (visible.size > 0) {
          const topmost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
          if (topmost) setActive(topmost[0]);
          return;
        }

        let passed: string | null = null;
        for (const id of list) {
          const element = document.getElementById(id);
          if (element && element.getBoundingClientRect().top <= HEADING_OFFSET) passed = id;
        }
        setActive(passed ?? list[0] ?? null);
      },
      { rootMargin: `-${HEADING_OFFSET}px 0px -${BOTTOM_BAND}% 0px`, threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

interface PostTocProps {
  headings: TocHeading[];
  /** Punto de corte del índice: `lg` (artículo/proyecto) o `xl` (clase de curso). */
  breakpoint?: TocBreakpoint;
  /** Rótulo de la columna de escritorio («En este artículo», «En este proyecto»…). */
  label?: string;
  /** Clase de anclaje inferior del FAB (para apilarlo sobre otro botón flotante). */
  bottomClass?: string;
}

/** Clases compartidas por los enlaces de índice (escritorio y hoja móvil). */
function linkClass(heading: TocHeading, active: string | null) {
  return cn(
    'block border-l-2 text-sm leading-snug transition-colors',
    heading.level === 3 ? 'pl-6' : 'pl-3',
    active === heading.id
      ? 'border-accent font-medium text-accent'
      : 'border-transparent text-muted-foreground hover:border-accent/40 hover:text-foreground',
  );
}

/**
 * Tabla de contenidos flotante (escritorio): sidebar `sticky top-24` en el
 * espacio sobrante al lado de la columna de lectura.
 */
export function PostToc({ headings, breakpoint = 'lg', label = 'En este artículo' }: PostTocProps) {
  const active = useActiveHeading(headings.map((heading) => heading.id));
  if (headings.length === 0) return null;

  return (
    <aside className={ASIDE_BREAKPOINT[breakpoint]}>
      <nav
        aria-label="Tabla de contenidos"
        className="thin-scrollbar sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-2 pr-1"
      >
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <ListTree className="h-3.5 w-3.5 text-accent" />
          {label}
        </p>
        <ul className="border-l border-border">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active === heading.id ? 'true' : undefined}
                className={cn('-ml-px py-1', linkClass(heading, active))}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

/**
 * Tabla de contenidos en móvil: botón flotante (FAB) abajo a la derecha que
 * abre una hoja deslizante desde el borde inferior.
 *
 * Sustituye al antiguo acordeón estático bajo la portada: el índice ya no
 * ocupa espacio en el flujo del artículo. La hoja se monta en un portal a
 * `document.body` para quedar por encima del header fijo (que tiene su propio
 * contexto de apilado) y se cierra con Escape, con el fondo o al elegir sección.
 *
 * Se renderiza SOLO en una vista de DETALLE (`/blog/[slug]`, `/proyectos/[slug]`
 * y `/cursos/[curso]/[clase]`): ni los listados ni el inicio montan el FAB.
 */
export function PostTocFab({
  headings,
  breakpoint = 'lg',
  bottomClass = 'bottom-6',
}: PostTocProps) {
  const pathname = usePathname();
  const active = useActiveHeading(headings.map((heading) => heading.id));
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // La hoja solo vive en el DOM mientras se abre o se cierra. Antes quedaba
  // SIEMPRE montada (solo desplazada con `translate-y-full`) y, al hacer scroll
  // en el móvil, la barra del navegador redimensiona el viewport dinámico y
  // asomaban unos píxeles de la cabecera por el borde inferior.
  const [present, setPresent] = useState(false);
  const [slid, setSlid] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Ciclo de vida de la hoja: monta y luego desliza (doble frame para que el
  // `translate-y-full` inicial llegue a pintarse y la transición se vea); al
  // cerrar desliza hacia abajo y se desmonta del DOM por completo.
  useEffect(() => {
    if (open) {
      setPresent(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setSlid(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setSlid(false);
    const timer = window.setTimeout(() => setPresent(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // El foco inicial se aplica cuando la hoja YA está en el DOM (antes el panel
  // estaba siempre montado; ahora nace al abrir, así que el foco va aquí).
  useEffect(() => {
    if (present) panelRef.current?.focus();
  }, [present]);

  // Escape y bloqueo del scroll de fondo (igual que el drawer del panel).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const goTo = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    // Cierra en el siguiente frame: si cerráramos antes, el desbloqueo del
    // scroll del fondo puede cortar el desplazamiento suave recién arrancado.
    requestAnimationFrame(() => setOpen(false));
  }, []);

  if (headings.length === 0) return null;
  // La tabla de contenidos es un elemento de la vista de detalle: en el inicio
  // o en los listados (/blog, /proyectos, /cursos sin slug) no debe existir ni
  // el FAB ni la hoja.
  if (pathname === null || !DETAIL_ROUTE.test(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="post-toc-sheet"
        aria-label="Abrir tabla de contenidos"
        className={cn(
          'fixed right-6 z-50 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/40 ring-1 ring-accent/50 transition-transform hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95',
          bottomClass,
          HIDE_FROM_BREAKPOINT[breakpoint],
        )}
      >
        <ListTree className="h-4 w-4 shrink-0" />
        Contenido
      </button>

      {mounted &&
        present &&
        createPortal(
          <div
            className={cn(
              'fixed inset-0 z-[60]',
              HIDE_FROM_BREAKPOINT[breakpoint],
              !open && 'pointer-events-none',
            )}
            aria-hidden={!open}
            inert={!open}
            data-state={open ? 'open' : 'closed'}
          >
            <div
              onClick={close}
              className={cn(
                'absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none',
                open ? 'opacity-100' : 'opacity-0',
              )}
            />

            <div
              id="post-toc-sheet"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Tabla de contenidos"
              tabIndex={-1}
              className={cn(
                'absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-2xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-2xl outline-none transition-transform duration-300 ease-out motion-reduce:transition-none',
                slid ? 'translate-y-0' : 'translate-y-full',
              )}
            >
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />

              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ListTree className="h-4 w-4 shrink-0 text-accent" />
                  Tabla de contenidos
                </p>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar tabla de contenidos"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ul className="thin-scrollbar overflow-y-auto px-4 py-2">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      aria-current={active === heading.id ? 'true' : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        goTo(heading.id);
                      }}
                      className={cn('py-2', linkClass(heading, active))}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

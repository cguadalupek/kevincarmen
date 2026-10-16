'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ListTree } from 'lucide-react';
import { cn } from '@kevincarmen/utils';
import type { TocHeading } from '@/lib/blog/headings';

/** Altura del header fijo (`h-16`) + margen: debe coincidir con `scroll-mt-24` y `top-24`. */
const HEADING_OFFSET = 96;
/** Banda inferior del viewport en la que un encabezado ya no cuenta como "activo". */
const BOTTOM_BAND = 60;

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
}

/**
 * Tabla de contenidos flotante (escritorio): sidebar `sticky top-24` en el
 * espacio sobrante al lado de la columna de lectura de 768 px.
 */
export function PostToc({ headings }: PostTocProps) {
  const active = useActiveHeading(headings.map((heading) => heading.id));
  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block">
      <nav
        aria-label="Tabla de contenidos"
        className="thin-scrollbar sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-2 pr-1"
      >
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <ListTree className="h-3.5 w-3.5 text-accent" />
          En este artículo
        </p>
        <ul className="border-l border-border">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active === heading.id ? 'true' : undefined}
                className={cn(
                  '-ml-px block border-l-2 py-1 text-sm leading-snug transition-colors',
                  heading.level === 3 ? 'pl-6' : 'pl-3',
                  active === heading.id
                    ? 'border-accent font-medium text-accent'
                    : 'border-transparent text-muted-foreground hover:border-accent/40 hover:text-foreground',
                )}
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
 * Tabla de contenidos en acordeón (`<details>`), justo antes del contenido:
 * sustituye al sidebar por debajo de `lg`. Se cierra al elegir una sección.
 */
export function PostTocMobile({ headings }: PostTocProps) {
  const active = useActiveHeading(headings.map((heading) => heading.id));
  const ref = useRef<HTMLDetailsElement>(null);
  if (headings.length === 0) return null;

  return (
    <details ref={ref} className="glass-card group/anc mb-8 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <ListTree className="h-4 w-4 shrink-0 text-accent" />
          Tabla de contenidos
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open/anc:rotate-180" />
      </summary>
      <ul className="border-t border-border px-4 py-3">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={() => {
                const element = ref.current;
                if (element) element.open = false;
              }}
              className={cn(
                'block border-l-2 py-1.5 text-sm leading-snug transition-colors',
                heading.level === 3 ? 'pl-6' : 'pl-3',
                active === heading.id
                  ? 'border-accent font-medium text-accent'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

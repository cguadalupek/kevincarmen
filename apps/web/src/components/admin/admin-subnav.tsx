'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface AdminSubNavItem {
  key: string;
  label: string;
  /** Icono lucide (se pinta a 16 px, con `shrink-0`). */
  icon?: React.ReactNode;
  /** Ruta: pinta un `<Link>`. Si falta, se pinta un botón (secciones internas). */
  href?: string;
  /** Subsección visible ahora mismo. */
  active?: boolean;
  badge?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Subsecciones de una sección del panel (pestañas).
 *
 * Es la barra que da orden dentro de una sección grande: «Proyectos / Clasificación»,
 * «Contenido / Ajustes del curso», etc. En móvil NO se rompe en varias filas: la barra
 * se desliza en horizontal (con el borde inferior a ancho completo) y cada ficha
 * mantiene 40 px de alto —área táctil cómoda— con el icono sin encogerse.
 */
export function AdminSubNav({
  items,
  ariaLabel = 'Subsecciones',
  className,
}: {
  items: AdminSubNavItem[];
  ariaLabel?: string;
  className?: string;
}) {
  const itemClass = (active: boolean) =>
    cn(
      'inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
      active
        ? 'bg-accent/15 text-accent'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      'disabled:pointer-events-none disabled:opacity-40',
    );

  return (
    <nav aria-label={ariaLabel} className={cn('mb-5 border-b border-border', className)}>
      <div className="no-scrollbar -mb-px flex items-center gap-1 overflow-x-auto pb-1">
        {items.map((item) => {
          const content = (
            <>
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="font-mono text-xs opacity-70">{item.badge}</span>
              ) : null}
            </>
          );

          if (item.href && !item.disabled) {
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={itemClass(Boolean(item.active))}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              aria-current={item.active ? 'page' : undefined}
              className={itemClass(Boolean(item.active))}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

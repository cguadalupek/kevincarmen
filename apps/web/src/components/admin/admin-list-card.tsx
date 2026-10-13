import { cn } from '@/lib/utils';

interface AdminListCardProps {
  /** Título de la tarjeta (texto o nodo). */
  title: React.ReactNode;
  /** Píldoras de estado a la derecha del título (Publicado, Borrador, tipo…). */
  badges?: React.ReactNode;
  /** Líneas de metadatos: slug/ruta y fecha. Usa `truncate` en las rutas largas. */
  meta?: React.ReactNode;
  /** Botonera inferior: Ver / Editar / Eliminar. */
  actions?: React.ReactNode;
  /** Contenido a la izquierda del título (miniatura/portada). */
  leading?: React.ReactNode;
  /** Contenido extra bajo la botonera (p. ej. la lista de subcategorías). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Tarjeta de listado reutilizable de TODO el panel (artículos, proyectos, lab,
 * recursos, cursos, videos, timeline, categorías).
 *
 * Mobile-first: en móvil es una columna (miniatura → título+badges → metadatos →
 * barra de acciones separada por un borde y alineada a la derecha); a partir de
 * `sm` recupera la fila horizontal con las acciones a la derecha. Los botones de
 * la barra se compactan solos (`px-2.5 text-xs`, alto táctil 36px) para que ningún
 * grupo de acciones desborde la tarjeta.
 */
export function AdminListCard({
  title,
  badges,
  meta,
  actions,
  leading,
  children,
  className,
}: AdminListCardProps) {
  return (
    <article className={cn('glass-card p-4 sm:p-5', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {leading ? <div className="shrink-0">{leading}</div> : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="min-w-0 text-base font-semibold leading-tight line-clamp-2 sm:text-lg">
              {title}
            </h2>
            {badges}
          </div>
          {meta ? (
            <div className="mt-1.5 flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground [&>p]:min-w-0">
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div
            className={cn(
              'flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3',
              'sm:shrink-0 sm:flex-nowrap sm:border-0 sm:pt-0',
              '[&_a]:h-9 [&_a]:px-2.5 [&_a]:text-xs [&_button]:h-9 [&_button]:px-2.5 [&_button]:text-xs',
              'sm:[&_a]:px-3 sm:[&_a]:text-sm sm:[&_button]:px-3 sm:[&_button]:text-sm',
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>

      {children}
    </article>
  );
}

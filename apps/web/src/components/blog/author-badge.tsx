import { Clock } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { AuthorAvatar } from '@/components/blog/author-avatar';

interface AuthorBadgeProps {
  name: string;
  avatar?: string | null;
  publishedAt?: string | null;
  readingTime?: number;
  /** Duración en minutos (clases de curso): se muestra como «12 min». */
  duration?: number;
}

/**
 * Atribución en la cabecera de un contenido: artículos, proyectos y clases.
 *
 * En móvil ocupa DOS filas limpias —avatar + nombre arriba y, debajo, fecha `•`
 * tiempo de lectura (o duración de la clase) en `text-xs` secundario—; desde
 * `md` vuelve a una sola línea horizontal. Antes era una única fila `flex` sin
 * `wrap` metida en el contenedor de metadatos, así que en pantallas pequeñas el
 * navegador partía «17 de octubre de 2026» y «4 min lectura» a media frase.
 *
 * Reglas para que no haya cortes raros: el nombre trunca (`truncate`) y la
 * fecha y el tiempo llevan `whitespace-nowrap`, de modo que o caben enteros o
 * el bloque baja de fila, pero nunca se corta una palabra.
 */
export function AuthorBadge({
  name,
  avatar,
  publishedAt,
  readingTime,
  duration,
}: AuthorBadgeProps) {
  const hasReadingTime = typeof readingTime === 'number';
  const hasDuration = typeof duration === 'number' && duration > 0;
  const hasTrailing = hasReadingTime || hasDuration;

  return (
    <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-2">
      {/* Fila 1 (móvil) = primera parte de la línea desde `md`. */}
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <AuthorAvatar name={name} src={avatar} size={24} />
        <span className="truncate">{name}</span>
      </span>

      {(publishedAt || hasTrailing) && (
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground md:text-sm">
          {publishedAt && (
            <>
              {/* El separador solo tiene sentido cuando comparte línea con el nombre. */}
              <span aria-hidden className="hidden text-border md:inline">
                •
              </span>
              <time dateTime={publishedAt} className="whitespace-nowrap font-normal">
                {formatDate(publishedAt)}
              </time>
            </>
          )}
          {publishedAt && hasTrailing && (
            <span aria-hidden className="text-border">
              •
            </span>
          )}
          {hasReadingTime && (
            <span className="flex items-center gap-1 whitespace-nowrap font-normal">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {readingTime} min lectura
            </span>
          )}
          {!hasReadingTime && hasDuration && (
            <span className="flex items-center gap-1 whitespace-nowrap font-normal">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {duration} min
            </span>
          )}
        </span>
      )}
    </div>
  );
}

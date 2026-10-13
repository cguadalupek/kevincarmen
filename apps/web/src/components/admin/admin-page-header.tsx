import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Ruta del enlace de vuelta. Por defecto `/admin`; pasa `null` para ocultarlo. */
  backHref?: string | null;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Cabecera de sección del panel.
 *
 * Mobile-first: en pantallas estrechas el título y el botón principal se apilan
 * (el botón ocupa todo el ancho); a partir de `sm` vuelven a la misma fila con el
 * botón a la derecha. El título arranca en `text-xl` y crece en escritorio.
 */
export function AdminPageHeader({
  title,
  subtitle,
  backHref = '/admin',
  backLabel = 'Dashboard',
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
        ) : null}
        <h1 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>

      {action ? (
        <div className="w-full [&_a]:w-full [&_button]:w-full sm:w-auto sm:shrink-0 sm:[&_a]:w-auto sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

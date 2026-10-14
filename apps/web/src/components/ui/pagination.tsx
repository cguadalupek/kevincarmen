'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  label: string;
  onChange: (page: number) => void;
}

/**
 * Paginación compacta: "Mostrando X–Y de Z" + controles anterior/números/siguiente.
 * Genera una ventana de páginas con elipsis cuando hay muchas.
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  label,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label={`Paginación de ${label}`}
      className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium text-foreground">
          {start}–{end}
        </span>{' '}
        de <span className="font-medium text-foreground">{totalItems}</span> {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/*
          En pantallas estrechas la lista de números no cabe (con 5+ páginas la fila
          desbordaba la pantalla): se cambia por un contador «Página X de Y» y los
          números vuelven a partir de `sm`. Lo que se toca sigue siendo lo mismo.
        */}
        <span className="px-2 text-sm text-muted-foreground sm:hidden">
          Página <span className="font-medium text-foreground">{page}</span> de {totalPages}
        </span>

        <div className="hidden items-center gap-1.5 sm:flex">
          {pages.map((entry, index) =>
            entry === '…' ? (
              <span key={`e-${index}`} className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onChange(entry)}
                aria-label={`Página ${entry}`}
                aria-current={entry === page ? 'page' : undefined}
                className={cn(
                  'h-9 w-9 rounded-lg border text-sm transition-colors',
                  entry === page
                    ? 'border-accent/60 bg-accent/15 font-medium text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground',
                )}
              >
                {entry}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-3"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

/** Ventana de páginas: primeras, alrededor de la actual y últimas, con elipsis. */
function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const set = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(set)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (value - previous > 1) result.push('…');
    result.push(value);
    previous = value;
  }
  return result;
}

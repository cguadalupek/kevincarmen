'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';

export interface FilterOption {
  /** Valor único de la opción (id, slug o nombre según el listado). */
  value: string;
  label: string;
  /** Cuántos ítems hay con esta opción: se pinta en la píldora de la fila. */
  count?: number;
  /**
   * Si viene, la fila es un enlace en vez de un botón. Lo usan los filtros del blog,
   * donde la URL (`?categoria=…&subcategoria=…`) sigue siendo la fuente de verdad y
   * el API filtra del lado del servidor.
   */
  href?: string;
}

interface FilterListProps {
  /** Rótulo del filtro (p. ej. «Clasificación», «Tipo», «Categoría»). */
  label: string;
  /** Icono del rótulo (lucide, 14 px). */
  icon: React.ReactNode;
  /** Opción activa. */
  value: string;
  /** Valor de «todas» (se pinta como primera fila del desplegable). */
  allValue: string;
  /** Rótulo de la opción «todas» (p. ej. «Todas las clasificaciones»). */
  allLabel: string;
  /** Cuántos ítems hay en total (píldora de la opción «todas» y del disparador). */
  allCount?: number;
  options: FilterOption[];
  /** Se dispara al elegir una opción (los filtros con estado local). */
  onSelect?: (value: string) => void;
  /** Texto del disparador cuando no hay ninguna opción que ofrecer. */
  emptyLabel?: string;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
}

/**
 * Lista estructurada de filtro de los listados públicos (Proyectos, Lab, Recursos y
 * Blog): rótulo con icono + disparador que abre un `listbox` con una fila por opción
 * (marca de la activa + píldora con el número de ítems).
 *
 * Es el MISMO componente en los cuatro listados a propósito: el diseño de Proyectos
 * (que es el que el dueño quiere como referencia) es el de todos, y cualquier ajuste
 * se hace en un solo sitio.
 */
export function FilterList({
  label,
  icon,
  value,
  allValue,
  allLabel,
  allCount,
  options,
  onSelect,
  emptyLabel = 'Sin opciones',
  disabled = false,
  className,
}: FilterListProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Cerrar con Escape o con un clic fuera del panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  // Sin opciones (y sin «todas» de lo que elegir) no hay desplegable que abrir.
  const hasChoices = options.length > 0;
  const active = value === allValue ? null : (options.find((option) => option.value === value) ?? null);
  const isDisabled = disabled || !hasChoices;
  const triggerLabel = isDisabled && !hasChoices ? emptyLabel : (active?.label ?? allLabel);
  const triggerCount = active?.count ?? allCount ?? 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <span
        id={labelId}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {icon} {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isDisabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        className={cn(
          'flex h-11 w-full items-center gap-2 rounded-xl border px-3 text-left text-sm transition-colors',
          FOCUS_RING,
          isDisabled && 'cursor-not-allowed opacity-60',
          !isDisabled &&
            (open || active
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-card/60 text-muted-foreground hover:border-accent/50 hover:text-foreground'),
          isDisabled && 'border-border bg-card/40 text-muted-foreground',
        )}
      >
        <span className="min-w-0 flex-1 truncate font-medium">{triggerLabel}</span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {triggerCount}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && !isDisabled && (
        <ul
          role="listbox"
          aria-labelledby={labelId}
          className="thin-scrollbar absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-2xl"
        >
          <FilterRow
            label={allLabel}
            count={allCount ?? 0}
            active={value === allValue}
            onSelect={() => {
              onSelect?.(allValue);
              setOpen(false);
            }}
          />
          {options.map((option) => (
            <FilterRow
              key={option.value}
              label={option.label}
              count={option.count ?? 0}
              active={value === option.value}
              href={option.href}
              onSelect={() => {
                onSelect?.(option.value);
                setOpen(false);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Fila del desplegable: marca de la activa + rótulo + cuántos ítems tiene. */
function FilterRow({
  label,
  count,
  active,
  href,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  href?: string;
  onSelect: () => void;
}) {
  const className = cn(
    'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
    FOCUS_RING,
    active ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  );
  const content = (
    <>
      <span className="flex w-4 shrink-0 justify-center">
        {active && <Check className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">{count}</span>
    </>
  );

  return (
    <li>
      {href ? (
        // `role="option"` en un enlace mantiene el listbox completo y, al ser <a>, la
        // URL sigue siendo navegable/indexable (filtros del blog).
        <Link href={href} role="option" aria-selected={active} onClick={onSelect} className={className}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          role="option"
          aria-selected={active}
          onClick={onSelect}
          className={className}
        >
          {content}
        </button>
      )}
    </li>
  );
}

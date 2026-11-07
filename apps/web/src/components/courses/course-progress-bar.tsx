import { cn } from '@/lib/utils';

/**
 * Barra de avance de un curso. Presentacional: no sabe de dónde sale el progreso
 * (local o nube), solo pinta `done / total`.
 */
export function CourseProgressBar({
  done,
  total,
  className,
  label = true,
}: {
  done: number;
  total: number;
  className?: string;
  /** Muestra «X de Y clases · N %» encima de la barra. */
  label?: boolean;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {done} de {total} clases
          </span>
          <span className="shrink-0 font-mono text-[11px] font-semibold text-accent">
            {percent} %
          </span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso del curso: ${done} de ${total} clases`}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

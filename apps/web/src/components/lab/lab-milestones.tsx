'use client';

import { useMemo, useState } from 'react';
import { FileText, Gauge, Milestone, Scale, Terminal } from 'lucide-react';
import { MarkdownContent } from '@/components/blog/markdown-content';
import {
  LAB_MILESTONE_KIND_LABELS,
  normalizeMilestones,
  type LabMilestone,
} from '@/lib/lab-milestone';
import { cn } from '@/lib/utils';

const KIND_ICON = {
  detail: FileText,
  terminal: Terminal,
  comparison: Scale,
  metrics: Gauge,
} as const;

interface LabMilestonesProps {
  milestones: LabMilestone[];
}

/**
 * Ficha de laboratorio interactiva: línea de tiempo vertical a la izquierda y
 * panel de detalle a la derecha. Hacer clic en un hito actualiza el panel sin
 * recargar la página (estado local).
 */
export function LabMilestones({ milestones }: LabMilestonesProps) {
  const items = useMemo(() => normalizeMilestones(milestones), [milestones]);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) return null;

  const active = items.find((m) => m.id === activeId) ?? items[0];

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 text-accent">
        <Milestone className="h-6 w-6" />
        <span className="font-mono text-sm">/ ficha de laboratorio</span>
      </div>
      <h2 className="mt-3 text-2xl font-bold">Ficha de laboratorio</h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Línea de tiempo vertical (columna izquierda) */}
        <nav aria-label="Hitos de la ficha de laboratorio">
          <ol className="relative">
            {items.map((milestone, index) => {
              const isActive = milestone.id === active.id;
              const isLast = index === items.length - 1;
              return (
                <li key={milestone.id} className="relative">
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-9 h-[calc(100%-20px)] w-px bg-border"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveId(milestone.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'relative flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      isActive
                        ? 'border-accent/50 bg-accent/5'
                        : 'border-transparent hover:border-border hover:bg-card/60',
                    )}
                  >
                    <span
                      className={cn(
                        'z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition',
                        isActive
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border bg-card text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 pt-1">
                      <span
                        className={cn(
                          'block font-medium leading-snug',
                          isActive ? 'text-foreground' : 'text-foreground/80',
                        )}
                      >
                        {milestone.title}
                      </span>
                      {milestone.summary && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                          {milestone.summary}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Panel lateral derecho (se actualiza al hacer clic) */}
        <div className="glass-card min-h-[320px] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-accent">
              {(() => {
                const Icon = KIND_ICON[active.kind];
                return <Icon className="h-4 w-4" />;
              })()}
              {LAB_MILESTONE_KIND_LABELS[active.kind]}
            </p>
            <span className="font-mono text-xs text-muted-foreground">
              {String(items.indexOf(active) + 1).padStart(2, '0')}/{String(items.length).padStart(2, '0')}
            </span>
          </div>
          <h3 className="mt-2 text-xl font-bold">{active.title}</h3>
          {active.summary && <p className="mt-1 text-sm text-muted-foreground">{active.summary}</p>}

          <div className="mt-4 border-t border-border/60 pt-4">
            <MilestoneDetail milestone={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MilestoneDetail({ milestone }: { milestone: LabMilestone }) {
  switch (milestone.kind) {
    case 'terminal':
      return (
        <div className="overflow-hidden rounded-xl border border-border bg-black/70">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">bash — logs</span>
          </div>
          <pre className="thin-scrollbar overflow-x-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-emerald-300/90">
            {milestone.content || 'Sin salida registrada.'}
          </pre>
        </div>
      );
    case 'comparison':
      return <ComparisonDetail content={milestone.content} />;
    case 'metrics':
      return <MetricsDetail content={milestone.content} />;
    default:
      return milestone.content ? (
        <MarkdownContent content={milestone.content} className="mt-0" />
      ) : (
        <p className="text-sm text-muted-foreground">Sin detalle configurado para este hito.</p>
      );
  }
}

/** Hipótesis vs Realidad: el contenido se parte en la primera línea `---`. */
function ComparisonDetail({ content }: { content: string }) {
  const parts = content.split(/\n---[ \t]*\n/);
  if (parts.length < 2) {
    return content ? (
      <MarkdownContent content={content} className="mt-0" />
    ) : (
      <p className="text-sm text-muted-foreground">
        Separa la hipótesis de la realidad con una línea <code className="font-mono">---</code>.
      </p>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[
        { label: 'Hipótesis', value: parts[0] },
        { label: 'Realidad', value: parts.slice(1).join('\n---\n') },
      ].map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <MarkdownContent content={value} className="mt-0" />
        </div>
      ))}
    </div>
  );
}

/** Métricas (HUD): una línea por métrica con el formato `Etiqueta: valor`. */
function MetricsDetail({ content }: { content: string }) {
  const metrics = content
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*(?:[-*]\s*)?(.+?)\s*[:=]\s*(.+?)\s*$/);
      if (!match) return null;
      return { label: match[1].trim(), value: match[2].trim() };
    })
    .filter((m): m is { label: string; value: string } => m !== null);

  if (metrics.length === 0) {
    return content ? (
      <MarkdownContent content={content} className="mt-0" />
    ) : (
      <p className="text-sm text-muted-foreground">
        Escribe una métrica por línea con el formato <code className="font-mono">Etiqueta: valor</code>.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-border bg-accent/5 p-4"
        >
          <p className="font-mono text-2xl font-bold text-accent">{metric.value}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  );
}

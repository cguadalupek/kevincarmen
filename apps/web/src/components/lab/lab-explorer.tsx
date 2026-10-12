'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock, FlaskConical, Play, Search } from 'lucide-react';
import type { PublicLabExperiment, ExperimentStatus } from '@/lib/api/lab';
import { cn } from '@/lib/utils';

const STATUS = {
  IN_PROGRESS: ['En pruebas', 'bg-blue-500/10 text-blue-300'],
  SUCCESS: ['Funcionó', 'bg-emerald-500/10 text-emerald-300'],
  PARTIAL: ['Funcionó con limitaciones', 'bg-amber-500/10 text-amber-300'],
  FAILED: ['No funcionó', 'bg-red-500/10 text-red-300'],
  ABANDONED: ['Abandonado', 'bg-zinc-500/10 text-zinc-300'],
} satisfies Record<ExperimentStatus, [string, string]>;

type Filter = 'ALL' | ExperimentStatus;

export function LabExplorer({ experiments }: { experiments: PublicLabExperiment[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      ALL: experiments.length,
      IN_PROGRESS: 0,
      SUCCESS: 0,
      PARTIAL: 0,
      FAILED: 0,
      ABANDONED: 0,
    };
    for (const experiment of experiments)
      result[experiment.status] = (result[experiment.status] ?? 0) + 1;
    return result;
  }, [experiments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiments.filter((experiment) => {
      if (filter !== 'ALL' && experiment.status !== filter) return false;
      if (!q) return true;
      return (
        experiment.title.toLowerCase().includes(q) ||
        experiment.description.toLowerCase().includes(q) ||
        experiment.stack.some((tech) => tech.toLowerCase().includes(q)) ||
        experiment.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [experiments, filter, query]);

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar experimento o tecnología…"
            className="w-72 rounded-lg border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'IN_PROGRESS', 'SUCCESS', 'PARTIAL', 'FAILED', 'ABANDONED'] as Filter[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  filter === status
                    ? 'border-accent/60 bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground',
                )}
              >
                {status === 'ALL' ? 'Todos' : STATUS[status][0]}
                <span className="ml-1.5 text-muted-foreground/70">{counts[status] ?? 0}</span>
              </button>
            ),
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          No hay experimentos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((experiment) => {
            const [label, color] = STATUS[experiment.status];
            return (
              <Link
                key={experiment.id}
                href={`/lab/${experiment.slug}`}
                className="glass-card group block h-full overflow-hidden transition hover:-translate-y-1 hover:border-accent/50"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  {experiment.coverImage ? (
                    <Image
                      src={experiment.coverImage}
                      alt={experiment.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/40">
                      <FlaskConical className="h-12 w-12 text-accent/40" />
                    </div>
                  )}
                  {experiment.videoUrl && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
                      <Play className="h-3 w-3" />
                      {experiment.videoDuration ? `${experiment.videoDuration} min` : 'Video'}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', color)}>
                      {label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold">
                    {experiment.title || 'Experimento legacy'}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {experiment.description}
                  </p>
                  {experiment.stack.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {experiment.stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span>{(experiment.startedAt ?? experiment.createdAt).slice(0, 10)}</span>
                    {experiment.readingTime > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {experiment.readingTime} min
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

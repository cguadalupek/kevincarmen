'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock, FlaskConical, Play, Search } from 'lucide-react';
import type { PublicLabExperiment, ExperimentStatus } from '@/lib/api/lab';
import { Pagination } from '@/components/ui/pagination';
import { FilterList } from '@/components/ui/filter-list';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 6;

const STATUS = {
  IN_PROGRESS: ['En pruebas', 'bg-blue-500/10 text-blue-300'],
  SUCCESS: ['Funcionó', 'bg-emerald-500/10 text-emerald-300'],
  PARTIAL: ['Funcionó con limitaciones', 'bg-amber-500/10 text-amber-300'],
  FAILED: ['No funcionó', 'bg-red-500/10 text-red-300'],
  ABANDONED: ['Abandonado', 'bg-zinc-500/10 text-zinc-300'],
} satisfies Record<ExperimentStatus, [string, string]>;

type Filter = 'ALL' | ExperimentStatus;

/** Estados en el orden del filtro de la lista (el «todos» lo añade `FilterList`). */
const STATUSES: ExperimentStatus[] = [
  'IN_PROGRESS',
  'SUCCESS',
  'PARTIAL',
  'FAILED',
  'ABANDONED',
];

export function LabExplorer({ experiments }: { experiments: PublicLabExperiment[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

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

  // Al cambiar filtro o búsqueda vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      {/*
        Buscador + estado: el estado va en la MISMA lista estructurada de filtro que
        Proyectos y Recursos (`components/ui/filter-list`), en vez de la fila de fichas.
      */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar experimento o tecnología…"
            aria-label="Buscar experimentos"
            className="h-11 w-full rounded-xl border border-border bg-card/60 py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <FilterList
          className="w-full sm:w-72"
          label="Estado"
          icon={<FlaskConical className="h-3.5 w-3.5" />}
          value={filter}
          allValue="ALL"
          allLabel="Todos los estados"
          allCount={experiments.length}
          options={STATUSES.map((status) => ({
            value: status,
            label: STATUS[status][0],
            count: counts[status] ?? 0,
          }))}
          onSelect={(value) => setFilter(value as Filter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          No hay experimentos que coincidan con tu búsqueda.
        </div>
      ) : (
        <>
          <div
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            key={`${filter}-${query}-${safePage}`}
          >
            {pageItems.map((experiment) => {
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
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            label="experimentos"
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Copy, ExternalLink, Pencil, Plus, Search, Trash2, Video } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api, type ApiLabExperiment } from '@/lib/api/client';
import { formatDate } from '@kevincarmen/utils';
import { cn } from '@/lib/utils';

const STATUS_META = {
  IN_PROGRESS: ['En pruebas', 'bg-blue-500/10 text-blue-300'],
  SUCCESS: ['Funcionó', 'bg-emerald-500/10 text-emerald-300'],
  PARTIAL: ['Funcionó con limitaciones', 'bg-amber-500/10 text-amber-300'],
  FAILED: ['No funcionó', 'bg-red-500/10 text-red-300'],
  ABANDONED: ['Abandonado', 'bg-zinc-500/10 text-zinc-300'],
} as const;

type StatusFilter = 'ALL' | ApiLabExperiment['status'];

export default function AdminLabPage() {
  const [experiments, setExperiments] = useState<ApiLabExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  function load() {
    setLoading(true);
    api
      .getLabExperiments()
      .then(setExperiments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar experimentos'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      ALL: experiments.length,
      IN_PROGRESS: 0,
      SUCCESS: 0,
      PARTIAL: 0,
      FAILED: 0,
      ABANDONED: 0,
    };
    for (const item of experiments) {
      result[item.status] = (result[item.status] ?? 0) + 1;
    }
    return result;
  }, [experiments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiments.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.stack.some((tech) => tech.toLowerCase().includes(q)) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [experiments, query, statusFilter]);

  async function handleDelete(item: ApiLabExperiment) {
    if (
      !window.confirm(
        `¿Eliminar el experimento "${item.title || 'sin título'}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await api.deleteLabExperiment(item.id);
      await api.revalidateSite();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function handleDuplicate(item: ApiLabExperiment) {
    try {
      const payload: Partial<ApiLabExperiment> = {
        title: `${item.title} (copia)`,
        description: item.description,
        content: item.content,
        status: item.status,
        published: false,
        stack: item.stack,
        tags: item.tags,
        objective: item.objective,
        hypothesis: item.hypothesis,
        conclusion: item.conclusion,
        coverImage: item.coverImage,
        gallery: item.gallery,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        videoUrl: item.videoUrl,
        videoDuration: item.videoDuration,
        chapters: item.chapters,
        relatedPostId: item.relatedPostId,
        relatedProjectId: item.relatedProjectId,
      };
      await api.createLabExperiment(payload);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al duplicar');
    }
  }

  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Experimentos del Lab</h1>
            <p className="text-sm text-muted-foreground">
              Cada experimento alimenta un video largo (10–20 min). Escribe el contenido con el
              editor enriquecido y añade el video con capítulos.
            </p>
          </div>
          <Button variant="accent" asChild>
            <Link href="/admin/lab/new">
              <Plus className="h-4 w-4" /> Nuevo experimento
            </Link>
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, stack o tag…"
              className="w-72 rounded-lg border border-border bg-muted/50 py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              ['ALL', 'IN_PROGRESS', 'SUCCESS', 'PARTIAL', 'FAILED', 'ABANDONED'] as StatusFilter[]
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  statusFilter === status
                    ? 'border-accent/60 bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground',
                )}
              >
                {status === 'ALL' ? 'Todos' : STATUS_META[status][0]}
                <span className="ml-1.5 text-muted-foreground/70">{counts[status] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : experiments.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-14 text-center">
            <p className="text-muted-foreground">Aún no hay experimentos.</p>
            <Button variant="accent" className="mt-4" asChild>
              <Link href="/admin/lab/new">Documentar el primero</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            Ningún experimento coincide con el filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const [statusLabel, statusClass] = STATUS_META[item.status];
              return (
                <div key={item.id} className="glass-card flex items-center gap-4 p-4">
                  {item.coverImage ? (
                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={item.coverImage}
                        alt={item.title || 'Portada'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-2xl">
                      🧪
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/lab/${item.id}`}
                        className="font-semibold hover:text-accent"
                      >
                        {item.title || 'Experimento legacy'}
                      </Link>
                      <span
                        className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusClass)}
                      >
                        {statusLabel}
                      </span>
                      {!item.published && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Borrador
                        </span>
                      )}
                      {item.videoUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                          <Video className="h-3 w-3" />
                          {item.videoDuration ? `${item.videoDuration} min` : 'Video'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 font-mono text-xs text-muted-foreground">
                      /lab/{item.slug}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Actualizado: {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.published && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/lab/${item.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" /> Ver
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/lab/${item.id}`}>
                        <Pencil className="h-4 w-4" /> Editar
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(item)}>
                      <Copy className="h-4 w-4" /> Duplicar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AdminAuthGuard>
  );
}

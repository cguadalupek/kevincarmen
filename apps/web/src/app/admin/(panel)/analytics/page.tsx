'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderTree,
  Heart,
  ListFilter,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { FilterList } from '@/components/ui/filter-list';
import { api, type ApiLikeAnalytics, type ApiLikeAnalyticsItem } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/**
 * Panel de analítica de likes.
 *
 * La ruta vive dentro de `admin/(panel)`, así que hereda `AdminAuthGuard` + `AdminShell`
 * del layout: si no hay token, el guard redirige a `/admin/login` antes de pintar nada.
 * Los datos los sirve `GET /likes/admin/analytics`, protegido con JWT en el API — la
 * protección real está ahí, no en el cliente.
 *
 * La sección de cada fila NO es un campo nuevo en `Post`: sale de la taxonomía que ya
 * existe (`mainCategory` en artículos, `projectCategory` en proyectos).
 */

interface MetricCard {
  key: Exclude<keyof ApiLikeAnalytics, 'items'>;
  label: string;
  hint: string;
  Icon: typeof Heart;
  /** La métrica que destaca el dueño: el total del contenido principal. */
  featured?: boolean;
}

const METRICS: MetricCard[] = [
  {
    key: 'posts',
    label: 'Likes en artículos',
    hint: 'Total acumulado',
    Icon: FileText,
    featured: true,
  },
  {
    key: 'projects',
    label: 'Likes en proyectos',
    hint: 'Total acumulado',
    Icon: FolderOpen,
  },
  { key: 'today', label: 'Hoy', hint: 'Desde las 00:00 (hora de Chile)', Icon: CalendarDays },
  { key: 'last7Days', label: 'Últimos 7 días', hint: 'Ventana móvil', Icon: TrendingUp },
  { key: 'last30Days', label: 'Últimos 30 días', hint: 'Ventana móvil', Icon: Heart },
];

const ALL = 'todas';
const SIN_SECCION = 'sin-seccion';

function sectionOf(item: ApiLikeAnalyticsItem): string {
  return item.section?.trim() ? item.section : SIN_SECCION;
}

function publicHref(item: ApiLikeAnalyticsItem): string {
  return item.type === 'POST' ? `/blog/${item.slug}` : `/proyectos/${item.slug}`;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<ApiLikeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [sectionFilter, setSectionFilter] = useState<string>(ALL);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getLikeAnalytics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];

  /** Secciones reales con su número de votos (solo las que tienen alguno). */
  const sections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = sectionOf(item);
      counts.set(key, (counts.get(key) ?? 0) + item.count);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({
        value,
        label: value === SIN_SECCION ? 'Sin sección' : value,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
  }, [items]);

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (typeFilter === ALL || item.type === typeFilter) &&
          (sectionFilter === ALL || sectionOf(item) === sectionFilter),
      ),
    [items, typeFilter, sectionFilter],
  );

  const postsCount = items.filter((item) => item.type === 'POST').reduce((n, i) => n + i.count, 0);
  const projectsCount = items
    .filter((item) => item.type === 'PROJECT')
    .reduce((n, i) => n + i.count, 0);

  return (
    <>
      <AdminPageHeader
        title="Analítica"
        subtitle="Rendimiento de los «me gusta» del sitio, por contenido y por sección"
        action={
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Actualizar
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map(({ key, label, hint, Icon, featured }) => (
          <div
            key={key}
            className={
              featured
                ? 'glass-card border-accent/40 p-5 sm:col-span-2 lg:col-span-1'
                : 'glass-card p-5'
            }
          >
            <div className="flex items-center gap-2 text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.12em]">{label}</span>
            </div>

            <p className="mt-3 text-3xl font-bold tabular-nums">
              {loading && !data ? '—' : ((data?.[key] ?? 0) as number).toLocaleString('es-CL')}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      {!loading && data && data.posts + data.projects === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Todavía no hay «me gusta» registrados. Aparecerán aquí en cuanto alguien pulse el corazón
          de una tarjeta en <span className="font-mono">/blog</span> o{' '}
          <span className="font-mono">/proyectos</span>.
        </div>
      )}

      {items.length > 0 && (
        <section className="mt-10" aria-labelledby="likes-por-contenido">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="likes-por-contenido" className="text-lg font-semibold">
                Likes por contenido
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {visibleItems.length} de {items.length} contenidos con votos ·{' '}
                {postsCount.toLocaleString('es-CL')} en artículos ·{' '}
                {projectsCount.toLocaleString('es-CL')} en proyectos
              </p>
            </div>
          </div>

          {/* Filtros: el componente compartido de Proyectos, Lab, Recursos y Blog. */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <FilterList
              className="w-full sm:w-64"
              label="Tipo"
              icon={<ListFilter className="h-3.5 w-3.5" />}
              value={typeFilter}
              allValue={ALL}
              allLabel="Todo el contenido"
              allCount={items.reduce((n, item) => n + item.count, 0)}
              options={[
                { value: 'POST', label: 'Artículos', count: postsCount },
                { value: 'PROJECT', label: 'Proyectos', count: projectsCount },
              ]}
              onSelect={setTypeFilter}
            />

            <FilterList
              className="w-full sm:w-64"
              label="Sección"
              icon={<FolderTree className="h-3.5 w-3.5" />}
              value={sectionFilter}
              allValue={ALL}
              allLabel="Todas las secciones"
              allCount={items.reduce((n, item) => n + item.count, 0)}
              options={sections}
              onSelect={setSectionFilter}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <caption className="sr-only">
                  Contenido con «me gusta», su sección y el total de votos
                </caption>
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Contenido
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Sección
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Tipo
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Likes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="max-w-[22rem] px-4 py-3">
                        <a
                          href={publicHref(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-start gap-1.5 font-medium hover:text-accent"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink
                            className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-accent"
                            aria-hidden="true"
                          />
                        </a>
                        {item.subcategory && (
                          <p className="mt-1 text-xs text-muted-foreground">{item.subcategory}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block rounded-full border px-2.5 py-0.5 text-xs',
                            item.section
                              ? 'border-accent/40 bg-accent/10 text-accent'
                              : 'border-border bg-muted/40 text-muted-foreground',
                          )}
                        >
                          {item.section ?? 'Sin sección'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.type === 'POST' ? 'Artículo' : 'Proyecto'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {item.count.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visibleItems.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Ningún contenido con votos en este filtro.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}

'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpenCheck,
  Download,
  Heart,
  LayoutGrid,
  Mail,
  Users,
} from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import type { ApiDashboardActivityDay, ApiDashboardSummary } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  summary: ApiDashboardSummary | null;
  loading: boolean;
}

const DAY_LABEL = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' });

/** `YYYY-MM-DD` (hora de Chile) → día local a mediodía, sin saltos de zona. */
function dayFromIso(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function plural(value: number, one: string, many: string): string {
  return `${value.toLocaleString('es-CL')} ${value === 1 ? one : many}`;
}

function dayTooltip(day: ApiDashboardActivityDay): string {
  return [
    formatDate(dayFromIso(day.date), 'es-CL'),
    plural(day.likes, 'like', 'likes'),
    plural(day.completions, 'clase completada', 'clases completadas'),
    plural(day.subscribers, 'suscripción', 'suscripciones'),
  ].join(' · ');
}

/**
 * Cuadro de estadísticas del dashboard.
 *
 * Solo pinta lo que la API mide en su propia base de datos: interacciones
 * (likes), progreso de cursos y altas de la newsletter. Las VISITAS no están
 * aquí porque el tráfico lo registra Umami en su propia instancia.
 */
export function DashboardStats({ summary, loading }: DashboardStatsProps) {
  const engagement = summary?.engagement;
  const days = summary?.activity ?? [];
  const recent = summary?.recent ?? [];

  const published =
    (summary?.content.posts.published ?? 0) +
    (summary?.content.projects.active ?? 0) +
    (summary?.content.lab.published ?? 0) +
    (summary?.content.resources.published ?? 0) +
    (summary?.content.courses.active ?? 0);

  const metrics = [
    {
      key: 'likes',
      label: 'Likes',
      value: engagement?.likes.total ?? 0,
      hint: `${engagement?.likes.today ?? 0} hoy · ${engagement?.likes.last7Days ?? 0} en 7 días`,
      Icon: Heart,
    },
    {
      key: 'completions',
      label: 'Clases completadas',
      value: engagement?.completions ?? 0,
      hint: plural(
        engagement?.students.activeLast7Days ?? 0,
        'alumno activo (7 días)',
        'alumnos activos (7 días)',
      ),
      Icon: BookOpenCheck,
    },
    {
      key: 'downloads',
      label: 'Descargas',
      value: engagement?.downloads ?? 0,
      hint: `${plural(summary?.content.resources.total ?? 0, 'recurso', 'recursos')} en total`,
      Icon: Download,
    },
    {
      key: 'subscribers',
      label: 'Suscriptores',
      value: engagement?.subscribers.active ?? 0,
      hint: `${engagement?.subscribers.total ?? 0} en total (newsletter)`,
      Icon: Mail,
    },
    {
      key: 'students',
      label: 'Alumnos',
      value: engagement?.students.total ?? 0,
      hint: 'Cuentas registradas en cursos',
      Icon: Users,
    },
    {
      key: 'published',
      label: 'Contenido publicado',
      value: published,
      hint: 'Visible ahora en el sitio',
      Icon: LayoutGrid,
    },
  ];

  const maxTotal = Math.max(1, ...days.map((day) => day.likes + day.completions + day.subscribers));
  const hasActivity = days.some((day) => day.likes + day.completions + day.subscribers > 0);

  return (
    <section className="mt-10" aria-labelledby="estadisticas-sitio">
      <div className="flex items-center gap-3 text-accent">
        <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        <span className="font-mono text-sm">/ actividad del sitio</span>
      </div>
      <h2 id="estadisticas-sitio" className="mt-2 text-xl font-bold">
        Estadísticas
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Interacciones de los últimos 14 días: likes, clases completadas y suscripciones.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ key, label, value, hint, Icon }) => (
          <div key={key} className="glass-card p-4">
            <div className="flex items-center gap-2 text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.12em]">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {loading && !summary ? '—' : value.toLocaleString('es-CL')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Serie diaria */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Actividad diaria</h3>
            <ul className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-accent" aria-hidden="true" />
                Likes
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" aria-hidden="true" />
                Clases
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-amber-300" aria-hidden="true" />
                Suscripciones
              </li>
            </ul>
          </div>

          {loading && !summary ? (
            <p className="mt-8 text-sm text-muted-foreground">Cargando estadísticas…</p>
          ) : (
            <>
              <div
                className="mt-5 flex items-end gap-1.5"
                role="img"
                aria-label="Actividad de los últimos 14 días"
              >
                {days.map((day) => {
                  const total = day.likes + day.completions + day.subscribers;
                  const height = Math.round((total / maxTotal) * 100);
                  return (
                    <div
                      key={day.date}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                      title={dayTooltip(day)}
                    >
                      <div className="flex h-36 w-full items-end justify-center">
                        <div
                          className={cn(
                            'flex w-full max-w-[26px] flex-col-reverse overflow-hidden rounded-sm',
                            total === 0 && 'bg-muted',
                          )}
                          style={{ height: `${height}%` }}
                        >
                          {day.likes > 0 && (
                            <span
                              className="w-full bg-accent"
                              style={{ height: `${(day.likes / total) * 100}%` }}
                            />
                          )}
                          {day.completions > 0 && (
                            <span
                              className="w-full bg-emerald-400"
                              style={{ height: `${(day.completions / total) * 100}%` }}
                            />
                          )}
                          {day.subscribers > 0 && (
                            <span
                              className="w-full bg-amber-300"
                              style={{ height: `${(day.subscribers / total) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {dayFromIso(day.date).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {!hasActivity && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Sin interacciones en los últimos 14 días.
                </p>
              )}
            </>
          )}
        </div>

        {/* Últimos cambios del CMS */}
        <div className="glass-card p-5">
          <h3 className="font-semibold">Últimos cambios</h3>
          {loading && !summary ? (
            <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
          ) : recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Todavía no hay contenido.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border/60">
              {recent.map((item) => (
                <li key={`${item.type}-${item.title}-${item.updatedAt}`}>
                  <Link
                    href={item.href}
                    className="group flex items-start gap-3 py-2.5 transition-colors hover:text-accent"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {item.type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatDate(item.updatedAt, 'es-CL')}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

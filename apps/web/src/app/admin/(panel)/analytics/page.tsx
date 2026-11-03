'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, FileText, FolderOpen, Heart, RefreshCw, TrendingUp } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { api, type ApiLikeAnalytics } from '@/lib/api/client';

/**
 * Panel de analítica de likes.
 *
 * La ruta vive dentro de `admin/(panel)`, así que hereda `AdminAuthGuard` + `AdminShell`
 * del layout: si no hay token, el guard redirige a `/admin/login` antes de pintar nada.
 * Los datos los sirve `GET /likes/admin/analytics`, protegido con JWT en el API — la
 * protección real está ahí, no en el cliente.
 */

interface MetricCard {
  key: keyof ApiLikeAnalytics;
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

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<ApiLikeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <>
      <AdminPageHeader
        title="Analítica"
        subtitle="Rendimiento de los «me gusta» del sitio"
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
    </>
  );
}

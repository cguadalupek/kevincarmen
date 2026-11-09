'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  FlaskConical,
  Plus,
  RefreshCw,
  Settings,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { api, type ApiDashboardSummary } from '@/lib/api/client';

interface DashboardSection {
  href: string;
  icon: typeof FileText;
  title: string;
  description: string;
  /** Total de la sección. Sin función = botón sin contador (Configuración). */
  count?: (summary: ApiDashboardSummary) => number;
  /** Desglose bajo la descripción. */
  hint?: (summary: ApiDashboardSummary) => string;
}

/** `3 publicados` / `1 publicado`: evita el plural con una sola unidad. */
function qty(value: number, one: string, many: string): string {
  return `${value.toLocaleString('es-CL')} ${value === 1 ? one : many}`;
}

const sections: DashboardSection[] = [
  {
    href: '/admin/posts',
    icon: FileText,
    title: 'Artículos',
    description: 'Crear, editar y publicar entradas del blog',
    count: (s) => s.content.posts.total,
    hint: (s) =>
      `${qty(s.content.posts.published, 'publicado', 'publicados')} · ${qty(
        s.content.posts.drafts,
        'borrador',
        'borradores',
      )}`,
  },
  {
    href: '/admin/videos',
    icon: Video,
    title: 'Videos del inicio',
    description: 'Enlaces de video que aparecen en la sección "Últimos videos"',
    count: (s) => s.content.videos.total,
    hint: (s) =>
      `${qty(s.content.videos.featured, 'destacado', 'destacados')} · ${qty(
        s.content.videos.shorts,
        'short',
        'shorts',
      )}`,
  },
  {
    href: '/admin/projects',
    icon: FolderOpen,
    title: 'Proyectos',
    description: 'Gestionar proyectos del portfolio',
    count: (s) => s.content.projects.total,
    hint: (s) =>
      `${qty(s.content.projects.active, 'activo', 'activos')} · ${qty(
        s.content.projects.archived,
        'archivado',
        'archivados',
      )}`,
  },
  {
    href: '/admin/courses',
    icon: GraduationCap,
    title: 'Cursos',
    description: 'Cursos publicados en la sección Cursos',
    count: (s) => s.content.courses.total,
    hint: (s) =>
      `${qty(s.content.courses.active, 'activo', 'activos')} · ${qty(
        s.content.courses.lessons,
        'clase',
        'clases',
      )}`,
  },
  {
    href: '/admin/lab',
    icon: FlaskConical,
    title: 'Lab',
    description: 'Experimentos documentados que alimentan los videos largos de YouTube',
    count: (s) => s.content.lab.total,
    hint: (s) => qty(s.content.lab.published, 'publicado', 'publicados'),
  },
  {
    href: '/admin/recursos',
    icon: Download,
    title: 'Recursos',
    description: 'Scripts, plantillas y descargas de la sección /recursos',
    count: (s) => s.content.resources.total,
    hint: (s) =>
      `${qty(s.content.resources.published, 'publicado', 'publicados')} · ${qty(
        s.engagement.downloads,
        'descarga',
        'descargas',
      )}`,
  },
  {
    href: '/admin/timeline',
    icon: Clock,
    title: 'Timeline',
    description: 'Hitos de la trayectoria que pinta la sección Sobre mí',
    count: (s) => s.content.timeline.total,
    hint: () => 'Hitos de la trayectoria',
  },
  {
    href: '/admin/settings',
    icon: Settings,
    title: 'Configuración',
    description: 'Título, contacto y redes sociales',
  },
];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<ApiDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await api.getDashboardSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadísticas.');
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
        title="Dashboard"
        subtitle="Bienvenido al panel de administración"
        backHref={null}
        action={
          <Button variant="accent" asChild className="min-h-[44px]">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
              Nuevo artículo
            </Link>
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mt-6 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            className="min-h-[44px] shrink-0"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Reintentar
          </Button>
        </div>
      )}

      {/* Accesos rápidos: cada sección con su total. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const count = summary && section.count ? section.count(summary) : null;
          const hint = summary && section.hint ? section.hint(summary) : null;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="glass-card flex min-h-[44px] flex-col p-5 hover-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-8 w-8 shrink-0 text-accent" aria-hidden="true" />
                {section.count && (
                  <span className="font-mono text-2xl font-bold tabular-nums text-foreground/90">
                    {loading && !summary ? '—' : (count ?? 0).toLocaleString('es-CL')}
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.description}
              </p>
              {section.hint && (
                <p className="mt-3 font-mono text-[11px] text-muted-foreground/80">
                  {loading && !summary ? 'Cargando…' : (hint ?? '—')}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <DashboardStats summary={summary} loading={loading} />
    </>
  );
}

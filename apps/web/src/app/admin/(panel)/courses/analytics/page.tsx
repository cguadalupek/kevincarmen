'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Mail,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { api, type ApiCourseAnalytics, type ApiStudentList } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const DAY_FMT = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FMT = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Iniciales del alumno para el avatar (el CMS no gestiona fotos de estudiante). */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/**
 * Métricas de la sección Cursos.
 *
 * Hereda `AdminAuthGuard` + `AdminShell` del layout del route group; los datos los
 * sirven `GET /courses/admin/analytics` y `GET /courses/admin/students`, protegidos
 * con JWT en el API (la protección real está ahí, no en el cliente).
 *
 * Solo cuenta ALUMNOS REGISTRADOS: el progreso de los invitados vive en su
 * navegador y no se puede medir desde el servidor. Es el número que importa, porque
 * es el que crece cuando alguien decide crear cuenta para no perder su avance.
 */
export default function AdminCourseAnalyticsPage() {
  const [data, setData] = useState<ApiCourseAnalytics | null>(null);
  const [studentList, setStudentList] = useState<ApiStudentList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Las métricas y el listado son endpoints distintos: si el listado falla, las
      // tarjetas de arriba se pintan igual (y viceversa).
      const [analytics, list] = await Promise.all([
        api.getCourseAnalytics(),
        api.getCourseStudents().catch(() => null),
      ]);
      setData(analytics);
      setStudentList(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const students = data?.students;
  const totals = data?.totals;
  const topChapters = data?.topChapters ?? [];
  const courses = data?.courses ?? [];
  const distribution = data?.distribution ?? [];
  const recent = data?.recent ?? [];
  const maxCompletions = Math.max(1, ...topChapters.map((row) => row.completions));
  const maxBucket = Math.max(1, ...distribution.map((bucket) => bucket.students));

  const metrics = [
    {
      key: 'students',
      label: 'Estudiantes registrados',
      value: students?.total ?? 0,
      hint: 'Cuentas creadas para sincronizar progreso',
      Icon: Users,
      featured: true,
    },
    {
      key: 'new7',
      label: 'Nuevos (7 días)',
      value: students?.last7Days ?? 0,
      hint: `${students?.last30Days ?? 0} en los últimos 30 días`,
      Icon: UserPlus,
    },
    {
      key: 'active7',
      label: 'Activos (7 días)',
      value: students?.activeLast7Days ?? 0,
      hint: 'Con alguna clase marcada esta semana',
      Icon: Activity,
    },
    {
      key: 'completions',
      label: 'Clases completadas',
      value: totals?.completions ?? 0,
      hint: `En ${totals?.chaptersWithProgress ?? 0} capítulos distintos`,
      Icon: CheckCircle2,
    },
    {
      key: 'avg',
      label: 'Avance medio',
      value: `${Math.round((totals?.avgCompletion ?? 0) * 100)} %`,
      hint: 'Media por alumno y curso empezado',
      Icon: TrendingUp,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Analíticas de cursos"
        subtitle="Alumnos registrados, capítulos más completados y avance general"
        backHref="/admin/courses"
        backLabel="Cursos"
        action={
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Actualizar
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ key, label, value, hint, Icon, featured }) => (
          <div
            key={key}
            className={cn(
              'glass-card p-5',
              featured && 'border-accent/40 sm:col-span-2 lg:col-span-1',
            )}
          >
            <div className="flex items-center gap-2 text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.12em]">{label}</span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {loading && !data
                ? '—'
                : typeof value === 'number'
                  ? value.toLocaleString('es-CL')
                  : value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      {!loading && data && (data.students.total === 0 || data.totals.completions === 0) && (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Todavía no hay progreso sincronizado. En cuanto un alumno cree cuenta y marque una clase
          en <span className="font-mono">/cursos</span>, sus datos aparecerán aquí.
        </div>
      )}

      {topChapters.length > 0 && (
        <section className="mt-10" aria-labelledby="capitulos-mas-completados">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="capitulos-mas-completados" className="text-lg font-semibold">
                Capítulos más completados
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {topChapters.length} capítulos con al menos una marca, ordenados de más a menos
              </p>
            </div>
          </div>

          <div className="mt-4 min-w-0 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Curso
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Capítulo
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Completados
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topChapters.map((row, index) => (
                  <tr key={`${row.courseId}-${row.chapterId}`} className="align-middle">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-muted-foreground">
                      {row.courseSlug ? (
                        <Link
                          href={`/cursos/${row.courseSlug}`}
                          className="hover:text-accent"
                          target="_blank"
                        >
                          {row.courseTitle}
                        </Link>
                      ) : (
                        row.courseTitle
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {String(row.chapterPosition).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 truncate">{row.chapterTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${(row.completions / maxCompletions) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs font-semibold tabular-nums">
                          {row.completions}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {courses.length > 0 && (
          <section aria-labelledby="avance-por-curso" className="min-w-0">
            <h2 id="avance-por-curso" className="text-lg font-semibold">
              Avance por curso
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Alumnos que empezaron cada curso y media de avance
            </p>

            <ul className="mt-4 space-y-3">
              {courses.map((course) => {
                const percent = Math.round(course.avgCompletion * 100);
                return (
                  <li key={course.courseId} className="glass-card p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/admin/courses/${course.courseId}`}
                        className="min-w-0 truncate text-sm font-medium hover:text-accent"
                      >
                        {course.title}
                      </Link>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {course.students} alumnos · {course.completions} clases
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-mono text-xs font-semibold text-accent">
                        {percent} %
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {course.chapters} capítulos publicados
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="distribucion-avance" className="min-w-0">
          <h2 id="distribucion-avance" className="text-lg font-semibold">
            Distribución del avance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuántos pares alumno–curso están en cada tramo
          </p>

          {distribution.every((bucket) => bucket.students === 0) ? (
            <div className="mt-4 rounded-xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              Sin datos todavía.
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {distribution.map((bucket) => (
                <li key={bucket.label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">
                    {bucket.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        bucket.label === '100 %' ? 'bg-emerald-400' : 'bg-accent',
                      )}
                      style={{ width: `${(bucket.students / maxBucket) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums">
                    {bucket.students}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {recent.length > 0 && (
            <>
              <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-4 w-4 text-accent" /> Actividad reciente
              </h2>
              <ul className="mt-3 space-y-2">
                {recent.map((row, index) => (
                  <li
                    key={`${row.userEmail}-${index}`}
                    className="flex items-start gap-2 border-b border-border/60 pb-2 text-xs last:border-0"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">{row.userName}</span>{' '}
                        <span className="text-muted-foreground">completó</span>{' '}
                        <span className="text-foreground">{row.chapterTitle}</span>
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {row.courseTitle} ·{' '}
                        {new Date(row.updatedAt).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="mt-10" aria-labelledby="alumnos-registrados">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="alumnos-registrados" className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-4 w-4 text-accent" /> Alumnos registrados
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {studentList
                ? `${studentList.total} ${studentList.total === 1 ? 'cuenta' : 'cuentas'} con rol de estudiante${
                    studentList.total > studentList.items.length
                      ? ` · mostrando las ${studentList.items.length} más recientes`
                      : ''
                  }`
                : loading
                  ? 'Cargando alumnos…'
                  : 'No se pudo cargar el listado de alumnos.'}
            </p>
          </div>
        </div>

        {studentList && studentList.items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Todavía no hay alumnos registrados. Las cuentas aparecen aquí en cuanto alguien se
            registre desde <span className="font-mono">/cuenta/registro</span>.
          </div>
        ) : studentList && studentList.items.length > 0 ? (
          <div className="mt-4 min-w-0 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Alumno
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Correo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Registro
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Avance
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Última actividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentList.items.map((student) => (
                  <tr key={student.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-[11px] font-semibold text-accent">
                          {initials(student.name)}
                        </span>
                        <span className="min-w-0 truncate font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${student.email}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {DAY_FMT.format(new Date(student.createdAt))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-mono text-xs font-semibold tabular-nums">
                        {student.chaptersCompleted}
                      </span>{' '}
                      <span className="text-xs text-muted-foreground">
                        {student.chaptersCompleted === 1 ? 'clase' : 'clases'} ·{' '}
                        {student.coursesStarted} {student.coursesStarted === 1 ? 'curso' : 'cursos'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {student.lastActivityAt
                        ? DATE_TIME_FMT.format(new Date(student.lastActivityAt))
                        : 'Sin actividad'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpenCheck className="h-3.5 w-3.5" />
        Los invitados no aparecen aquí: su progreso se guarda solo en su navegador.
        <Link href="/cursos" target="_blank" className="inline-flex items-center gap-1 text-accent">
          Ver el catálogo <ExternalLink className="h-3 w-3" />
        </Link>
      </p>
    </>
  );
}

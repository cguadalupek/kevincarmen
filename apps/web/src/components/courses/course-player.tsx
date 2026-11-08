'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Cloud,
  FileText,
  HelpCircle,
  ListOrdered,
  LogIn,
  PanelRightOpen,
  Play,
  RotateCcw,
  Wrench,
  X,
} from 'lucide-react';
import type { PublicCourseDetail, FlattenedLesson } from '@/lib/api/courses';
import { flattenCurriculum } from '@/lib/api/courses';
import { extractHeadings } from '@/lib/blog/headings';
import { FREE_CHAPTER_COUNT, isFreeChapter } from '@/lib/course-progress';
import { LessonVideo } from '@/components/courses/lesson-video';
import { CourseProgressBar } from '@/components/courses/course-progress-bar';
import { CourseSyncBar } from '@/components/courses/course-sync-bar';
import { useCourseProgress } from '@/components/courses/use-course-progress';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { AuthorBadge } from '@/components/blog/author-badge';
import { PostToc, PostTocFab } from '@/components/blog/post-toc';
import { cn } from '@/lib/utils';

const TYPE_META = {
  VIDEO: { label: 'Video', icon: Play },
  ARTICLE: { label: 'Lectura', icon: FileText },
  PRACTICE: { label: 'Práctica', icon: Wrench },
  QUIZ: { label: 'Quiz', icon: HelpCircle },
} as const;

/**
 * Reproductor de clase.
 *
 * Modelo freemium NO intrusivo: los tres primeros capítulos son de acceso libre y
 * público, y del cuarto en adelante el contenido también se lee (no hay muro). Lo
 * que cambia es el progreso: el invitado lo guarda en su navegador y la cuenta lo
 * sincroniza en la nube entre dispositivos.
 */
export function CoursePlayer({
  course,
  initialLessonSlug,
  author,
}: {
  course: PublicCourseDetail;
  initialLessonSlug: string;
  /** Autor resuelto en el servidor (`GET /site` › `siteConfig`). */
  author: { name: string; avatar: string | null };
}) {
  const lessons = useMemo(() => flattenCurriculum(course), [course]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set());

  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.slug === initialLessonSlug),
  );
  const current = lessons[currentIndex];
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  // Índice de la clase: los h2/h3 del markdown de ESTA clase.
  const headings = useMemo(() => extractHeadings(current?.content ?? ''), [current?.content]);

  // Progreso del curso (local para invitados, nube con cuenta).
  const lessonIds = useMemo(() => lessons.map((lesson) => lesson.id), [lessons]);
  const progress = useCourseProgress(course.id, lessonIds);
  const isDone = current ? progress.completed.has(current.id) : false;

  // Al cambiar de clase: sube al inicio y cierra el temario móvil.
  useEffect(() => {
    setSidebarOpen(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [current?.slug]);

  if (!current) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Este curso aún no tiene clases publicadas.
      </div>
    );
  }

  const toggleModule = (moduleIndex: number) => {
    setCollapsedModules((prevSet) => {
      const nextSet = new Set(prevSet);
      if (nextSet.has(moduleIndex)) nextSet.delete(moduleIndex);
      else nextSet.add(moduleIndex);
      return nextSet;
    });
  };

  const lessonHref = (lesson: FlattenedLesson) => `/cursos/${course.slug}/${lesson.slug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* migas */}
      <nav className="mb-4 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <Link href="/cursos" className="shrink-0 hover:text-accent">
          Cursos
        </Link>
        <span className="shrink-0">/</span>
        <Link href={`/cursos/${course.slug}`} className="min-w-0 truncate hover:text-accent">
          {course.title}
        </Link>
        <span className="shrink-0">/</span>
        <span className="min-w-0 truncate text-foreground">{current.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_360px_14rem]">
        {/* ── columna principal ── */}
        <main className="min-w-0">
          {progress.isAnonymous && <CourseSyncBar />}

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-accent">
            <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium">
              Módulo {current.moduleIndex + 1} · {current.moduleTitle}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Clase {current.lessonIndex + 1} de {lessons.length}
            </span>
            {isFreeChapter(currentIndex) ? (
              <span className="rounded-full border border-emerald-500/30 px-2.5 py-1 font-medium text-emerald-400">
                Gratis
              </span>
            ) : (
              !progress.isAnonymous && (
                <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  <Cloud className="h-3 w-3" /> Sincronizado
                </span>
              )
            )}
          </div>

          {/* Móvil: autor en una fila y fecha • duración en otra. */}
          <div className="mb-4 flex flex-col items-start gap-2 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2">
            <AuthorBadge
              name={author.name}
              avatar={author.avatar}
              publishedAt={course.updatedAt}
              duration={current.duration}
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{current.title}</h1>
          {current.description && (
            <p className="mt-2 text-muted-foreground">{current.description}</p>
          )}

          {current.videoUrl ? (
            <div className="mt-6">
              <LessonVideo videoUrl={current.videoUrl} title={current.title} />
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
              <TypeIcon type={current.type} className="h-4 w-4 text-accent" />
              Clase {TYPE_META[current.type].label.toLowerCase()} — lee el material y haz la
              práctica.
            </div>
          )}

          {current.content && (
            <div className="mt-6">
              <MarkdownContent content={current.content} headings={headings} />
            </div>
          )}

          {current.resources && current.resources.length > 0 && (
            <div className="mt-8 rounded-xl border border-border bg-card/50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-accent">
                <ListOrdered className="h-4 w-4" /> Recursos de la clase
              </h3>
              <ul className="mt-3 space-y-2">
                {current.resources.map((resource, i) => (
                  <li key={`${resource.url}-${i}`}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent underline-offset-4 hover:underline"
                    >
                      {resource.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* marcar clase como completada */}
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => progress.toggle(current.id, !isDone)}
              aria-pressed={isDone}
              className={cn(
                'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors',
                isDone
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-border text-foreground hover:border-accent/50 hover:text-accent',
              )}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {isDone ? 'Clase completada' : 'Marcar como completada'}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {progress.isAnonymous ? 'Se guarda en este navegador' : 'Guardado en tu cuenta'}
              </span>
              {next && !isDone && (
                <Link
                  href={lessonHref(next)}
                  onClick={() => progress.toggle(current.id, true)}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Completar y seguir →
                </Link>
              )}
            </div>
          </div>
          {progress.error && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {progress.error}
            </p>
          )}

          {/* prev / next */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={lessonHref(prev)}
                className="glass-card group p-4 transition-all hover:border-accent/50"
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  ← Anterior
                </span>
                <span className="mt-1 block truncate text-sm font-medium group-hover:text-accent">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={lessonHref(next)}
                className="glass-card group p-4 text-right transition-all hover:border-accent/50"
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Siguiente →
                </span>
                <span className="mt-1 block truncate text-sm font-medium group-hover:text-accent">
                  {next.title}
                </span>
              </Link>
            ) : (
              <div className="glass-card p-4 text-right">
                <span className="text-[11px] uppercase tracking-wide text-accent">
                  Fin del curso 🎓
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Última clase del temario. ¡Nos vemos en el siguiente curso!
                </span>
              </div>
            )}
          </div>

          {/* Índice de la clase: hoja deslizante en móvil y tablet (el temario
              ya ocupa la columna derecha hasta `xl`). */}
          <PostTocFab headings={headings} breakpoint="xl" bottomClass="bottom-20" />
        </main>

        {/* ── barra lateral: temario ── */}
        <aside className="hidden lg:block">
          <SidebarContent
            course={course}
            lessons={lessons}
            currentSlug={current.slug}
            collapsedModules={collapsedModules}
            onToggleModule={toggleModule}
            progress={progress}
          />
        </aside>

        {/* ── índice de la clase (tercera columna, solo en pantallas anchas) ── */}
        <PostToc headings={headings} breakpoint="xl" label="En esta clase" />
      </div>

      {/* drawer móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar temario"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(320px,88vw)] flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-semibold">Temario del curso</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SidebarContent
                course={course}
                lessons={lessons}
                currentSlug={current.slug}
                collapsedModules={collapsedModules}
                onToggleModule={toggleModule}
                progress={progress}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 lg:hidden"
      >
        <PanelRightOpen className="h-4 w-4" />
        Clases
      </button>
    </div>
  );
}

/* ─────────────────────────── sidebar ─────────────────────────── */

function SidebarContent({
  course,
  lessons,
  currentSlug,
  collapsedModules,
  onToggleModule,
  progress,
}: {
  course: PublicCourseDetail;
  lessons: FlattenedLesson[];
  currentSlug: string;
  collapsedModules: Set<number>;
  onToggleModule: (moduleIndex: number) => void;
  progress: ReturnType<typeof useCourseProgress>;
}) {
  const { done, total, completed, isAnonymous, user, reset } = progress;

  return (
    <div className="thin-scrollbar rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <CourseProgressBar done={done} total={total} className="mb-4" />

      <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Temario · {lessons.length} clases
      </p>
      <p className="mb-3 text-[11px] leading-snug text-muted-foreground/80">
        Los {FREE_CHAPTER_COUNT} primeros capítulos son gratis.
      </p>
      <div className="space-y-1">
        {course.modules.map((module, moduleIndex) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
          if (moduleLessons.length === 0) return null;
          const collapsed = collapsedModules.has(moduleIndex);
          return (
            <div key={module.id} className="overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={() => onToggleModule(moduleIndex)}
                aria-expanded={!collapsed}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                  {moduleIndex + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{module.title}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    collapsed && '-rotate-90',
                  )}
                />
              </button>
              {!collapsed && (
                <div className="border-t border-border bg-card/40">
                  {moduleLessons.map((lesson) => {
                    const isCurrent = lesson.slug === currentSlug;
                    const meta = TYPE_META[lesson.type];
                    return (
                      <Link
                        key={lesson.id}
                        href={`/cursos/${course.slug}/${lesson.slug}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors',
                          isCurrent
                            ? 'bg-accent/10 text-accent'
                            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                        )}
                      >
                        {isCurrent ? (
                          <Play className="h-4 w-4 shrink-0 fill-accent text-accent" />
                        ) : (
                          <meta.icon className="h-4 w-4 shrink-0 text-border" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        {completed.has(lesson.id) && (
                          <CheckCircle2
                            className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                            aria-label="Clase completada"
                          />
                        )}
                        {lesson.duration > 0 && (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                            {lesson.duration}m
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* sesión del alumno: sin cuenta el progreso no sale del navegador */}
      <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        {isAnonymous ? (
          <Link
            href="/cuenta/ingresar"
            className="inline-flex min-h-[36px] items-center gap-1.5 text-accent hover:underline"
          >
            <LogIn className="h-3.5 w-3.5" /> Inicia sesión para sincronizar
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{user?.name}</span>
            </span>
            {done > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Reiniciar el progreso de este curso?')) void reset();
                }}
                className="inline-flex min-h-[36px] shrink-0 items-center gap-1 transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reiniciar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypeIcon({ type, className }: { type: FlattenedLesson['type']; className?: string }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return <Icon className={className} />;
}

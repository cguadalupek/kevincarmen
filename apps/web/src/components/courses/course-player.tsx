'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  GraduationCap,
  HelpCircle,
  ListOrdered,
  Lock,
  PanelRightOpen,
  Play,
  RotateCcw,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import type { PublicCourseDetail, FlattenedLesson } from '@/lib/api/courses';
import { flattenCurriculum } from '@/lib/api/courses';
import { useCourseProgress } from '@/lib/course-progress';
import { LessonVideo } from '@/components/courses/lesson-video';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPE_META = {
  VIDEO: { label: 'Video', icon: Play },
  ARTICLE: { label: 'Lectura', icon: FileText },
  PRACTICE: { label: 'Práctica', icon: Wrench },
  QUIZ: { label: 'Quiz', icon: HelpCircle },
} as const;

export function CoursePlayer({
  course,
  initialLessonSlug,
}: {
  course: PublicCourseDetail;
  initialLessonSlug: string;
}) {
  const router = useRouter();
  const lessons = useMemo(() => flattenCurriculum(course), [course]);
  const lessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);

  const progress = useCourseProgress(course.slug, lessonIds);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set());
  const [justCompleted, setJustCompleted] = useState(false);

  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.slug === initialLessonSlug),
  );
  const current = lessons[currentIndex];
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Al navegar entre clases: anota la última vista y sube al inicio.
  useEffect(() => {
    if (current) {
      progress.setLast(current.slug);
      setJustCompleted(false);
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.slug]);

  if (!current) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Este curso aún no tiene clases publicadas.
      </div>
    );
  }

  const handleVideoEnded = () => {
    if (!progress.isCompleted(current.id)) {
      progress.markComplete(current.id, current.slug);
      setJustCompleted(true);
    }
  };

  const toggleModule = (moduleIndex: number) => {
    setCollapsedModules((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(moduleIndex)) nextSet.delete(moduleIndex);
      else nextSet.add(moduleIndex);
      return nextSet;
    });
  };

  const lessonHref = (lesson: FlattenedLesson) => `/cursos/${course.slug}/${lesson.slug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* migas + mobile */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/cursos" className="hover:text-accent">
          Cursos
        </Link>
        <span>/</span>
        <Link href={`/cursos/${course.slug}`} className="hover:text-accent">
          {course.title}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{current.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── columna principal ── */}
        <main className="min-w-0">
          <div className="mb-4 flex items-center gap-2 text-xs text-accent">
            <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium">
              Módulo {current.moduleIndex + 1} · {current.moduleTitle}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Clase {current.lessonIndex + 1} de {lessons.length}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{current.title}</h1>
          {current.description && (
            <p className="mt-2 text-muted-foreground">{current.description}</p>
          )}

          {current.videoUrl ? (
            <div className="mt-6">
              <LessonVideo
                videoUrl={current.videoUrl}
                title={current.title}
                onEnded={handleVideoEnded}
              />
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
              <TypeIcon type={current.type} className="h-4 w-4 text-accent" />
              Clase {TYPE_META[current.type].label.toLowerCase()} — lee el material y haz la
              práctica.
            </div>
          )}

          {/* completado */}
          <div
            className={cn(
              'mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all',
              justCompleted || progress.isCompleted(current.id)
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border bg-card/40 text-muted-foreground',
            )}
          >
            {progress.isCompleted(current.id) ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Completaste esta clase. ¡Buen trabajo!
              </>
            ) : justCompleted ? (
              <>
                <Zap className="h-4 w-4" />
                ¡Clase completada al terminar el video!
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                Marca la clase como completada cuando termines.
              </>
            )}
          </div>

          {current.content && (
            <div className="mt-2">
              <MarkdownContent content={current.content} />
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

          {/* acciones */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              variant={progress.isCompleted(current.id) ? 'outline' : 'accent'}
              onClick={() => progress.toggle(current.id, current.slug)}
            >
              {progress.isCompleted(current.id) ? (
                <>
                  <Check className="h-4 w-4" /> Completada — quitar
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Marcar como completada
                </>
              )}
            </Button>
            {!current.isFree && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Clase de pago
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={progress.clear} className="ml-auto">
              <RotateCcw className="h-3.5 w-3.5" /> Reiniciar progreso
            </Button>
          </div>

          {/* prev / next */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  Completaste el temario. ¡Nos vemos en el siguiente curso!
                </span>
              </div>
            )}
          </div>
        </main>

        {/* ── barra lateral: progreso + temario (Platzi) ── */}
        <aside className="hidden lg:block">
          <SidebarContent
            course={course}
            lessons={lessons}
            currentSlug={current.slug}
            progressPercent={progress.percent}
            completedCount={progress.completedCount}
            total={progress.total}
            isComplete={progress.isComplete}
            isCompleted={progress.isCompleted}
            collapsedModules={collapsedModules}
            onToggleModule={toggleModule}
          />
        </aside>
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
          <div className="absolute right-0 top-0 flex h-full w-[320px] flex-col bg-card shadow-2xl">
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
                progressPercent={progress.percent}
                completedCount={progress.completedCount}
                total={progress.total}
                isComplete={progress.isComplete}
                isCompleted={progress.isCompleted}
                collapsedModules={collapsedModules}
                onToggleModule={toggleModule}
                onNavigate={() => setSidebarOpen(false)}
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
        Temario · {progress.percent}%
      </button>
    </div>
  );
}

/* ─────────────────────────── sidebar ─────────────────────────── */

function SidebarContent({
  course,
  lessons,
  currentSlug,
  progressPercent,
  completedCount,
  total,
  isComplete,
  isCompleted,
  collapsedModules,
  onToggleModule,
  onNavigate,
}: {
  course: PublicCourseDetail;
  lessons: FlattenedLesson[];
  currentSlug: string;
  progressPercent: number;
  completedCount: number;
  total: number;
  isComplete: boolean;
  isCompleted: (lessonId: string) => boolean;
  collapsedModules: Set<number>;
  onToggleModule: (moduleIndex: number) => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm thin-scrollbar">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-accent" />
        <h2 className="font-semibold">Tu progreso</h2>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between">
          <span className="font-mono text-3xl font-bold text-accent">{progressPercent}%</span>
          <span className="text-xs text-muted-foreground">
            {completedCount} de {total} clases
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent shadow-[0_0_10px_rgb(var(--accent)/0.6)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {isComplete && (
          <p className="mt-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            🎉 ¡Curso completado! Vuelve a repasar cuando quieras.
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Temario
        </p>
        <div className="space-y-1">
          {course.modules.map((module, moduleIndex) => {
            const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
            if (moduleLessons.length === 0) return null;
            const moduleComplete =
              moduleLessons.length > 0 &&
              moduleLessons.every((l) => isCompleted(l.id));
            const collapsed = collapsedModules.has(moduleIndex);
            return (
              <div key={module.id} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => onToggleModule(moduleIndex)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      moduleComplete
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {moduleComplete ? <Check className="h-3 w-3" /> : moduleIndex + 1}
                  </span>
                  <span className="flex-1 truncate">{module.title}</span>
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
                      const done = isCompleted(lesson.id);
                      const isCurrent = lesson.slug === currentSlug;
                      const meta = TYPE_META[lesson.type];
                      return (
                        <Link
                          key={lesson.id}
                          href={`/cursos/${course.slug}/${lesson.slug}`}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors',
                            isCurrent
                              ? 'bg-accent/10 text-accent'
                              : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                          ) : isCurrent ? (
                            <Play className="h-4 w-4 shrink-0 fill-accent text-accent" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-border" />
                          )}
                          <span className="flex-1 truncate">{lesson.title}</span>
                          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
                            <meta.icon className="h-3 w-3" />
                            {lesson.duration > 0 ? `${lesson.duration}m` : ''}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ type, className }: { type: FlattenedLesson['type']; className?: string }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return <Icon className={className} />;
}
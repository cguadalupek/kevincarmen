'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FolderPlus,
  GripVertical,
  ListVideo,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/blog/markdown-content';
import {
  api,
  type ApiCourse,
  type ApiCourseModule,
  type ApiLesson,
  type ApiLessonResource,
  type LessonTypeValue,
} from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface CourseStudioPageProps {
  params: Promise<{ id: string }>;
}

type Selection =
  { kind: 'settings' } | { kind: 'module'; id: string } | { kind: 'lesson'; id: string };

const DRAFT_KEY_PREFIX = 'kc:admin:course:';

const LEVEL_LABELS = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
} as const;

const STATUS_LABELS = {
  COMING_SOON: 'Próximamente',
  AVAILABLE: 'Disponible',
  IN_PROGRESS: 'En producción',
  ARCHIVED: 'Archivado',
} as const;

const LESSON_TYPE_LABELS: Record<LessonTypeValue, string> = {
  VIDEO: '🎬 Video',
  ARTICLE: '📄 Lectura',
  PRACTICE: '🛠️ Práctica',
  QUIZ: '❓ Quiz',
};

const inputCls =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none';
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';

const newId = () =>
  `new-${
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  }`;

export default function CourseStudio({ params }: CourseStudioPageProps) {
  const { id } = use(params);

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [sel, setSel] = useState<Selection>({ kind: 'settings' });
  const [draftBanner, setDraftBanner] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCourseAdmin(id);
      setCourse(data);
      setDirty(false);
      setSel({ kind: 'settings' });
      // ¿Hay un borrador de una sesión anterior?
      try {
        const raw = localStorage.getItem(DRAFT_KEY_PREFIX + id);
        if (raw) {
          const draft = JSON.parse(raw) as ApiCourse;
          if (
            JSON.stringify(draft.modules) !== JSON.stringify(data.modules) ||
            draft.title !== data.title ||
            draft.status !== data.status
          ) {
            setDraftBanner(true);
          }
        }
      } catch {
        // sin borrador o corrupto: ignorar
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Autoguardado local (borrador) mientras se edita.
  const skipNextDraft = useRef(true);
  useEffect(() => {
    if (!course) return;
    if (skipNextDraft.current) {
      skipNextDraft.current = false;
      return;
    }
    if (!dirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY_PREFIX + id, JSON.stringify(course));
      } catch {
        // almacenamiento lleno o privado: no es crítico
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [course, dirty, id]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY_PREFIX + id);
      if (raw) {
        setCourse(JSON.parse(raw) as ApiCourse);
        setDirty(true);
        setDraftBanner(false);
        toastOk('Borrador restaurado');
      }
    } catch {
      setDraftBanner(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY_PREFIX + id);
    setDraftBanner(false);
  };

  const toastOk = (text: string) => setToast({ kind: 'ok', text });
  const toastErr = (text: string) => setToast({ kind: 'err', text });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ───────────── mutaciones del árbol ───────────── */

  const patch = useCallback((updater: (course: ApiCourse) => ApiCourse) => {
    setCourse((prev) => (prev ? updater(prev) : prev));
    setDirty(true);
  }, []);

  const addModule = () => {
    const mod: ApiCourseModule = {
      id: newId(),
      title: `Módulo ${(course?.modules.length ?? 0) + 1}`,
      description: '',
      position: course?.modules.length ?? 0,
      lessons: [],
      createdAt: '',
      updatedAt: '',
    };
    patch((c) => ({ ...c, modules: [...c.modules, mod] }));
    setSel({ kind: 'module', id: mod.id });
  };

  const addLesson = (moduleIndex: number) => {
    const lesson: ApiLesson = {
      id: newId(),
      title: 'Clase nueva',
      slug: '',
      description: '',
      type: 'VIDEO',
      videoUrl: '',
      videoType: 'YOUTUBE',
      content: '',
      duration: 0,
      resources: [],
      isFree: true,
      published: true,
      position: 0,
      createdAt: '',
      updatedAt: '',
    };
    patch((c) => {
      const modules = c.modules.map((m, i) =>
        i === moduleIndex
          ? { ...m, lessons: [...m.lessons, { ...lesson, position: m.lessons.length }] }
          : m,
      );
      return { ...c, modules };
    });
    setSel({ kind: 'lesson', id: lesson.id });
  };

  const duplicateLesson = (moduleIndex: number, lessonIndex: number) => {
    patch((c) => {
      const modules = c.modules.map((m, i) => {
        if (i !== moduleIndex) return m;
        const original = m.lessons[lessonIndex];
        const copy: ApiLesson = {
          ...original,
          id: newId(),
          title: `${original.title} (copia)`,
          slug: '',
          position: lessonIndex + 1,
        };
        const lessons = [...m.lessons];
        lessons.splice(lessonIndex + 1, 0, copy);
        return { ...m, lessons };
      });
      return { ...c, modules };
    });
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const lesson = course?.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    if (!window.confirm(`¿Eliminar la clase "${lesson.title}"?`)) return;
    patch((c) => ({
      ...c,
      modules: c.modules.map((m, i) =>
        i === moduleIndex ? { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIndex) } : m,
      ),
    }));
    setSel({ kind: 'module', id: course!.modules[moduleIndex].id });
  };

  const removeModule = (moduleIndex: number) => {
    const mod = course?.modules[moduleIndex];
    if (!mod) return;
    const count = mod.lessons.length;
    const confirmText =
      count > 0
        ? `¿Eliminar el módulo "${mod.title}" y su${count > 1 ? 's' : ''} ${count} clase${count > 1 ? 's' : ''}?`
        : `¿Eliminar el módulo "${mod.title}"?`;
    if (!window.confirm(confirmText)) return;
    patch((c) => ({ ...c, modules: c.modules.filter((_, i) => i !== moduleIndex) }));
    setSel({ kind: 'settings' });
  };

  const duplicateModule = (moduleIndex: number) => {
    patch((c) => {
      const modules = [...c.modules];
      const original = modules[moduleIndex];
      const copy: ApiCourseModule = {
        ...original,
        id: newId(),
        title: `${original.title} (copia)`,
        lessons: original.lessons.map((l) => ({ ...l, id: newId(), slug: '' })),
      };
      modules.splice(moduleIndex + 1, 0, copy);
      return { ...c, modules };
    });
  };

  const moveModule = (from: number, to: number) => {
    patch((c) => {
      const modules = [...c.modules];
      const [moved] = modules.splice(from, 1);
      modules.splice(to, 0, moved);
      return { ...c, modules };
    });
  };

  const moveLesson = (fromM: number, fromL: number, toM: number, toL: number) => {
    patch((c) => {
      const modules = c.modules.map((m) => ({ ...m, lessons: [...m.lessons] }));
      const [moved] = modules[fromM].lessons.splice(fromL, 1);
      modules[toM].lessons.splice(toL, 0, moved);
      return { ...c, modules };
    });
  };

  const patchModule = (moduleIndex: number, patchData: Partial<ApiCourseModule>) => {
    patch((c) => ({
      ...c,
      modules: c.modules.map((m, i) => (i === moduleIndex ? { ...m, ...patchData } : m)),
    }));
  };

  const patchLesson = (moduleIndex: number, lessonIndex: number, patchData: Partial<ApiLesson>) => {
    patch((c) => ({
      ...c,
      modules: c.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: m.lessons.map((l, j) => (j === lessonIndex ? { ...l, ...patchData } : l)),
            }
          : m,
      ),
    }));
  };

  /* ───────────── arrastrar y soltar ───────────── */

  const [dragFrom, setDragFrom] = useState<{ m: number; l?: number } | null>(null);

  const onLessonDrop = (m: number, l: number) => {
    if (!dragFrom || dragFrom.l === undefined) return;
    let toL = l;
    if (dragFrom.m === m && dragFrom.l < l) toL -= 1; // se reordena tras quitar el origen
    moveLesson(dragFrom.m, dragFrom.l, m, toL);
    setDragFrom(null);
  };

  const onModuleDrop = (m: number) => {
    if (!dragFrom) return;
    if (dragFrom.l !== undefined) {
      moveLesson(dragFrom.m, dragFrom.l, m, course!.modules[m].lessons.length);
    } else {
      let to = m;
      if (dragFrom.m < m) to -= 1;
      moveModule(dragFrom.m, to);
    }
    setDragFrom(null);
  };

  /* ───────────── guardar ───────────── */

  const handleSave = async () => {
    if (!course) return;
    setSaving(true);
    setError('');
    try {
      const meta: Partial<ApiCourse> = {
        title: course.title.trim() || 'Curso sin título',
        slug: course.slug.trim() || undefined,
        description: course.description,
        subtitle: course.subtitle || null,
        level: course.level,
        duration: course.duration,
        status: course.status,
        coverImage: course.coverImage || null,
        position: course.position ?? 0,
        learningPoints: course.learningPoints.filter((p) => p.trim() !== ''),
        requirements: course.requirements.filter((r) => r.trim() !== ''),
        targetAudience: course.targetAudience || null,
      };
      await api.updateCourse(course.id, meta);

      const modules = course.modules.map((m) => ({
        id: m.id.startsWith('new-') ? undefined : m.id,
        title: m.title.trim() || 'Módulo sin título',
        description: m.description || null,
        lessons: m.lessons.map((l) => ({
          id: l.id.startsWith('new-') ? undefined : l.id,
          title: l.title.trim() || 'Clase sin título',
          slug: l.slug.trim() || undefined,
          description: l.description || null,
          type: l.type,
          videoUrl: l.videoUrl || null,
          videoType: l.videoType || 'YOUTUBE',
          content: l.content || null,
          duration: l.duration || 0,
          resources: l.resources,
          isFree: l.isFree,
          published: l.published,
        })),
      }));

      await api.saveCourseCurriculum(course.id, modules);

      const fresh = await api.getCourseAdmin(course.id);
      setCourse(fresh);
      setDirty(false);
      localStorage.removeItem(DRAFT_KEY_PREFIX + course.id);
      setSel({ kind: 'settings' });
      toastOk('Curso guardado ✔');
    } catch (err) {
      toastErr(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  /* ───────────── render ───────────── */

  const selModuleIndex = useMemo(() => {
    if (!course || sel.kind !== 'module') return -1;
    return course.modules.findIndex((m) => m.id === sel.id);
  }, [course, sel]);

  const selLesson = useMemo(() => {
    if (!course || sel.kind !== 'lesson') return null;
    for (let i = 0; i < course.modules.length; i += 1) {
      const found = course.modules[i].lessons.findIndex((l) => l.id === sel.id);
      if (found >= 0) return { moduleIndex: i, lessonIndex: found };
    }
    return null;
  }, [course, sel]);

  const publishedCount = course?.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.published).length,
    0,
  );
  const totalMinutes = course?.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration || 0), 0),
    0,
  );

  return (
    <>
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent" /> Cargando curso...
        </div>
      ) : !course ? (
        <div className="flex h-full items-center justify-center p-8 text-center text-sm text-red-400">
          {error || 'No se pudo cargar el curso.'}
          <Button variant="outline" size="sm" onClick={load} className="ml-3">
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          {/* barra superior sticky */}
          <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="flex items-center gap-3 px-6 py-3">
              <Link
                href="/admin/courses"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" /> Cursos
              </Link>
              <div className="h-5 w-px bg-border" />
              <h1 className="truncate text-sm font-semibold">
                {course.title || 'Curso sin título'}
              </h1>
              {dirty && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> Cambios sin guardar
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground md:block">
                  {course.modules.length} módulos · {publishedCount} clases ·{' '}
                  {Math.floor((totalMinutes ?? 0) / 60)} h{' '}
                  {(totalMinutes ?? 0) % 60 > 0 ? `${(totalMinutes ?? 0) % 60} m` : ''}
                </span>
                {course.status !== 'ARCHIVED' && course.slug && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cursos/${course.slug}`} target="_blank">
                      <Eye className="h-4 w-4" /> Ver sitio
                    </Link>
                  </Button>
                )}
                <Button variant="accent" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>

            {draftBanner && (
              <div className="flex items-center gap-3 border-t border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="flex-1">Tienes un borrador sin guardar de tu última sesión.</span>
                <Button variant="outline" size="sm" onClick={restoreDraft}>
                  Restaurar borrador
                </Button>
                <Button variant="ghost" size="sm" onClick={discardDraft}>
                  Descartar
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* cuerpo: constructor + inspector */}
          <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            {/* ── izquierda: curriculum ── */}
            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <ListVideo className="h-4 w-4 text-accent" /> Contenido del curso
                </h2>
                <span className="text-xs text-muted-foreground">
                  Arrastra las clases para reordenarlas, o usa las flechas.
                </span>
              </div>

              <div className="space-y-4">
                {course.modules.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    Aún no hay módulos. Empieza creando el primero con el botón de abajo.
                  </div>
                )}

                {course.modules.map((module, m) => (
                  <div
                    key={module.id}
                    draggable
                    onDragStart={(e) => {
                      setDragFrom({ m });
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onModuleDrop(m)}
                    className={cn(
                      'rounded-xl border bg-card/40 transition-colors',
                      sel.kind === 'module' && sel.id === module.id
                        ? 'border-accent/60'
                        : 'border-border',
                    )}
                  >
                    {/* cabecera del módulo */}
                    <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50" />
                      <button
                        type="button"
                        onClick={() => setSel({ kind: 'module', id: module.id })}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold',
                            sel.kind === 'module' && sel.id === module.id
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-accent/10 text-accent',
                          )}
                        >
                          {m + 1}
                        </span>
                        <span className="truncate text-sm font-semibold hover:text-accent">
                          {module.title || 'Módulo sin título'}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {module.lessons.length}
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <IconBtn
                          title="Subir módulo"
                          disabled={m === 0}
                          onClick={() => moveModule(m, m - 1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn
                          title="Bajar módulo"
                          disabled={m === course.modules.length - 1}
                          onClick={() => moveModule(m, m + 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn title="Duplicar módulo" onClick={() => duplicateModule(m)}>
                          <Copy className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn title="Eliminar módulo" danger onClick={() => removeModule(m)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconBtn>
                      </div>
                    </div>

                    {/* clases */}
                    <div className="p-2">
                      {module.lessons.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Sin clases todavía.
                        </p>
                      )}
                      {module.lessons.map((lesson, l) => (
                        <div
                          key={lesson.id}
                          draggable
                          onDragStart={(e) => {
                            setDragFrom({ m, l });
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onLessonDrop(m, l)}
                          className={cn(
                            'group flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40',
                            sel.kind === 'lesson' && sel.id === lesson.id ? 'bg-accent/10' : '',
                          )}
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                          <button
                            type="button"
                            onClick={() => setSel({ kind: 'lesson', id: lesson.id })}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <span
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px]',
                                lesson.published
                                  ? 'bg-accent/10 text-accent'
                                  : 'bg-muted text-muted-foreground',
                              )}
                              title={lesson.published ? 'Publicada' : 'Oculta'}
                            >
                              {lesson.published ? '✓' : '·'}
                            </span>
                            <span className="w-8 shrink-0 font-mono text-[10px] text-muted-foreground/60">
                              {m + 1}.{l + 1}
                            </span>
                            <span className="truncate text-[13px] hover:text-accent">
                              {lesson.title || 'Clase sin título'}
                            </span>
                          </button>
                          <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground/70 sm:block">
                            {LESSON_TYPE_LABELS[lesson.type].split(' ')[1]}
                            {lesson.duration > 0 ? ` · ${lesson.duration}m` : ''}
                          </span>
                          <IconBtn title="Duplicar clase" onClick={() => duplicateLesson(m, l)}>
                            <Copy className="h-3 w-3" />
                          </IconBtn>
                          <IconBtn title="Eliminar clase" danger onClick={() => removeLesson(m, l)}>
                            <Trash2 className="h-3 w-3" />
                          </IconBtn>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addLesson(m)}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        <Plus className="h-3.5 w-3.5" /> Añadir clase
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addModule}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/60 hover:bg-accent/5 hover:text-accent"
              >
                <FolderPlus className="h-4 w-4" /> Añadir módulo
              </button>
            </div>

            {/* ── derecha: inspector ── */}
            <aside className="h-fit rounded-2xl border border-border bg-card/50 p-5 lg:sticky lg:top-[70px]">
              {sel.kind === 'settings' && course && (
                <SettingsInspector
                  course={course}
                  patch={(data) => patch((c) => ({ ...c, ...data }) as ApiCourse)}
                />
              )}
              {sel.kind === 'module' && selModuleIndex >= 0 && (
                <ModuleInspector
                  module={course.modules[selModuleIndex]}
                  patch={(data) => patchModule(selModuleIndex, data)}
                />
              )}
              {sel.kind === 'lesson' && selLesson && (
                <LessonInspector
                  label={`Clase ${selLesson.moduleIndex + 1}.${selLesson.lessonIndex + 1}`}
                  lesson={course.modules[selLesson.moduleIndex].lessons[selLesson.lessonIndex]}
                  patch={(data) => patchLesson(selLesson.moduleIndex, selLesson.lessonIndex, data)}
                />
              )}
            </aside>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md',
            toast.kind === 'ok'
              ? 'border-accent/40 bg-card/95 text-accent'
              : 'border-red-500/40 bg-card/95 text-red-400',
          )}
        >
          {toast.kind === 'ok' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.text}
        </div>
      )}
    </>
  );
}

/* ───────────── iconos pequeños ───────────── */

function IconBtn({
  children,
  title,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30',
        danger ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

function TextareaList({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const text = value.join('\n');
  return (
    <textarea
      value={text}
      onChange={(e) => onChange(e.target.value.split('\n'))}
      placeholder={placeholder}
      rows={Math.max(3, value.length + 1)}
      className={cn(inputCls, 'font-mono text-[13px]')}
    />
  );
}

/* ───────────── inspector: ajustes del curso ───────────── */

function SettingsInspector({
  course,
  patch,
}: {
  course: ApiCourse;
  patch: (data: Partial<ApiCourse>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      patch({ coverImage: result.url });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al subir la portada');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Pencil className="h-4 w-4 text-accent" /> Ajustes del curso
      </h2>

      <div>
        <label className={labelCls}>Título</label>
        <input
          value={course.title}
          onChange={(e) => patch({ title: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Slug</label>
          <input
            value={course.slug}
            onChange={(e) => patch({ slug: e.target.value })}
            placeholder="auto-generado"
            className={cn(inputCls, 'font-mono text-[13px]')}
          />
        </div>
        <div>
          <label className={labelCls}>Posición</label>
          <input
            type="number"
            value={course.position ?? 0}
            onChange={(e) => patch({ position: Number.parseInt(e.target.value, 10) || 0 })}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Subtítulo (va bajo el título)</label>
        <input
          value={course.subtitle ?? ''}
          onChange={(e) => patch({ subtitle: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          value={course.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={3}
          className={inputCls}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Nivel</label>
          <select
            value={course.level}
            onChange={(e) => patch({ level: e.target.value as ApiCourse['level'] })}
            className={inputCls}
          >
            {Object.entries(LEVEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select
            value={course.status}
            onChange={(e) => patch({ status: e.target.value as ApiCourse['status'] })}
            className={inputCls}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Duración (texto)</label>
          <input
            value={course.duration}
            onChange={(e) => patch({ duration: e.target.value })}
            placeholder="6 h 15 min"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Portada</label>
        <div className="flex gap-2">
          <input
            value={course.coverImage ?? ''}
            onChange={(e) => patch({ coverImage: e.target.value })}
            placeholder="URL de la imagen"
            className={inputCls}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Subir
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
        />
      </div>

      <div>
        <label className={labelCls}>Lo que aprenderás (una por línea)</label>
        <TextareaList
          value={course.learningPoints}
          onChange={(learningPoints) => patch({ learningPoints })}
          placeholder={'Comandos esenciales de la terminal\nGestionar permisos y usuarios'}
        />
      </div>
      <div>
        <label className={labelCls}>Requisitos (una por línea)</label>
        <TextareaList
          value={course.requirements}
          onChange={(requirements) => patch({ requirements })}
          placeholder={'Ningún conocimiento previo\nUna computadora con 4 GB de RAM'}
        />
      </div>
      <div>
        <label className={labelCls}>A quién va dirigido</label>
        <input
          value={course.targetAudience ?? ''}
          onChange={(e) => patch({ targetAudience: e.target.value })}
          placeholder="Personas sin experiencia en Linux..."
          className={inputCls}
        />
      </div>
    </div>
  );
}

/* ───────────── inspector: módulo ───────────── */

function ModuleInspector({
  module,
  patch,
}: {
  module: ApiCourseModule;
  patch: (data: Partial<ApiCourseModule>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <FolderPlus className="h-4 w-4 text-accent" /> Módulo
      </h2>
      <div>
        <label className={labelCls}>Título del módulo</label>
        <input
          value={module.title}
          onChange={(e) => patch({ title: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Descripción corta (opcional)</label>
        <textarea
          value={module.description ?? ''}
          onChange={(e) => patch({ description: e.target.value })}
          rows={3}
          className={inputCls}
        />
      </div>
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Este módulo tiene <span className="font-semibold text-accent">{module.lessons.length}</span>{' '}
        clases. Selecciona una clase del listado para editarla.
      </p>
    </div>
  );
}

/* ───────────── inspector: clase ───────────── */

function LessonInspector({
  label,
  lesson,
  patch,
}: {
  label: string;
  lesson: ApiLesson;
  patch: (data: Partial<ApiLesson>) => void;
}) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const resources = lesson.resources ?? [];

  const setResource = (index: number, field: 'label' | 'url', value: string) => {
    const next = resources.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    patch({ resources: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <ListVideo className="h-4 w-4 text-accent" /> {label}
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => patch({ published: !lesson.published })}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors',
              lesson.published
                ? 'bg-accent/10 text-accent hover:bg-accent/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
            title={lesson.published ? 'Publicada: visible en el sitio' : 'Oculta: no visible'}
          >
            {lesson.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {lesson.published ? 'Publicada' : 'Oculta'}
          </button>
        </div>
      </div>

      <div>
        <label className={labelCls}>Título de la clase</label>
        <input
          value={lesson.title}
          onChange={(e) => patch({ title: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Tipo</label>
          <select
            value={lesson.type}
            onChange={(e) => patch({ type: e.target.value as LessonTypeValue })}
            className={inputCls}
          >
            {Object.entries(LESSON_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Duración (minutos)</label>
          <input
            type="number"
            min={0}
            value={lesson.duration || 0}
            onChange={(e) => patch({ duration: Number.parseInt(e.target.value, 10) || 0 })}
            className={inputCls}
          />
        </div>
      </div>

      {lesson.type === 'VIDEO' && (
        <div>
          <label className={labelCls}>URL del video (YouTube, Vimeo o MP4)</label>
          <input
            value={lesson.videoUrl ?? ''}
            onChange={(e) => patch({ videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className={cn(inputCls, 'font-mono text-[13px]')}
          />
          {lesson.videoUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border bg-black">
              <iframe
                src={embedPreview(lesson.videoUrl)}
                title="Vista previa"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label className={labelCls}>Descripción corta (bajo el título)</label>
        <input
          value={lesson.description ?? ''}
          onChange={(e) => patch({ description: e.target.value })}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Contenido (Markdown)</label>
        <div className="mb-2 flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(['edit', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                tab === t
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'edit' ? 'Editar' : 'Vista previa'}
            </button>
          ))}
        </div>
        {tab === 'edit' ? (
          <textarea
            value={lesson.content ?? ''}
            onChange={(e) => patch({ content: e.target.value })}
            rows={14}
            placeholder={
              '# Encabezado de la clase\n\nTexto con **negritas**, `código` y \n```bash\ncomandos\n```'
            }
            className={cn(inputCls, 'font-mono text-[13px] leading-relaxed')}
          />
        ) : (
          <div className="thin-scrollbar max-h-[420px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
            {lesson.content?.trim() ? (
              <MarkdownContent content={lesson.content} />
            ) : (
              <p className="text-xs text-muted-foreground">Sin contenido todavía.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Recursos (enlaces de la clase)</label>
        {resources.map((resource, i) => (
          <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={resource.label}
              onChange={(e) => setResource(i, 'label', e.target.value)}
              placeholder="Etiqueta"
              className={inputCls}
            />
            <input
              value={resource.url}
              onChange={(e) => setResource(i, 'url', e.target.value)}
              placeholder="https://..."
              className={cn(inputCls, 'font-mono text-[12px]')}
            />
            <button
              type="button"
              onClick={() => patch({ resources: resources.filter((_, j) => j !== i) })}
              className="rounded-lg border border-border px-2 text-muted-foreground hover:border-red-500/50 hover:text-red-400"
              title="Quitar recurso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => patch({ resources: [...resources, { label: 'Documentación', url: '' }] })}
          className="mt-1 flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Añadir recurso
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={lesson.isFree}
            onChange={(e) => patch({ isFree: e.target.checked })}
            className="h-4 w-4 accent-[rgb(var(--accent))]"
          />
          Clase gratuita
        </label>
        <span className="font-mono text-[11px] text-muted-foreground/60">
          slug: {lesson.slug || 'auto'}
        </span>
      </div>
    </div>
  );
}

function embedPreview(url: string): string {
  try {
    const u = new URL(url);
    if (/youtube\.com|youtu\.be/.test(u.hostname)) {
      let id = '';
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1).split('?')[0];
      else id = u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? '';
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : url;
    }
    if (/vimeo\.com/.test(u.hostname)) {
      const id = u.pathname.split('/').pop() ?? '';
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return url;
  }
}

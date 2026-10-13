'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListVideo, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { api, type ApiCourse } from '@/lib/api/client';

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

function emptyCourse(): Partial<ApiCourse> {
  return {
    title: '',
    slug: '',
    description: '',
    level: 'BEGINNER',
    duration: '',
    lessonsCount: 0,
    status: 'COMING_SOON',
    coverImage: '',
    position: 0,
  };
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<ApiCourse> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api
      .getCourses()
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar cursos'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');

    const payload: Partial<ApiCourse> = {
      title: (editing.title ?? '').trim(),
      slug: editing.slug?.trim() || undefined,
      description: (editing.description ?? '').trim(),
      level: editing.level,
      duration: (editing.duration ?? '').trim(),
      lessonsCount: editing.lessonsCount ?? 0,
      status: editing.status,
      coverImage: editing.coverImage?.trim() || undefined,
      position: editing.position ?? 0,
    };

    try {
      if (editing.id) await api.updateCourse(editing.id, payload);
      else {
        const created = await api.createCourse(payload);
        // Tras crear, se va directo al constructor de contenido.
        router.push(`/admin/courses/${created.id}`);
        return;
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setError('');
    try {
      const result = await api.uploadImage(file);
      setEditing((current) => (current ? { ...current, coverImage: result.url } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la portada');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(course: ApiCourse) {
    if (!window.confirm(`¿Eliminar el curso "${course.title}"?`)) return;
    try {
      await api.deleteCourse(course.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Cursos"
        subtitle="Agrega los cursos que se mostrarán en la sección Cursos del sitio."
        action={
          <Button variant="accent" onClick={() => setEditing(emptyCourse())} disabled={!!editing}>
            <Plus className="h-4 w-4" /> Nuevo curso
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="glass-card mb-6 space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing.id ? 'Editar curso' : 'Nuevo curso'}</h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cerrar formulario"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                value={editing.title ?? ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug (opcional)</label>
              <input
                value={editing.slug ?? ''}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="Se genera del título si lo dejas vacío"
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nivel</label>
              <select
                value={editing.level ?? 'BEGINNER'}
                onChange={(e) =>
                  setEditing({ ...editing, level: e.target.value as ApiCourse['level'] })
                }
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <select
                value={editing.status ?? 'COMING_SOON'}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as ApiCourse['status'] })
                }
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Duración</label>
              <input
                value={editing.duration ?? ''}
                onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                placeholder="8 horas"
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Lecciones</label>
              <input
                type="number"
                min={0}
                value={editing.lessonsCount ?? 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    lessonsCount: Number.parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Portada</label>
              <div className="flex gap-2">
                <input
                  value={editing.coverImage ?? ''}
                  onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })}
                  placeholder="URL o sube una imagen"
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-border px-3 text-sm hover:border-accent"
                >
                  {uploading ? '...' : 'Subir'}
                </button>
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
              <label className="mb-1 block text-sm font-medium">Posición</label>
              <input
                type="number"
                value={editing.position ?? 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    position: Number.parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : editing.id ? 'Actualizar curso' : 'Crear curso'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          Aún no hay cursos.
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <AdminListCard
              key={course.id}
              title={course.title}
              badges={
                <>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                    {STATUS_LABELS[course.status]}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {LEVEL_LABELS[course.level]}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {course.duration}
                  </span>
                </>
              }
              meta={
                course.description ? <p className="line-clamp-2">{course.description}</p> : null
              }
              actions={
                <>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => router.push(`/admin/courses/${course.id}`)}
                    title="Editor del contenido del curso"
                  >
                    <ListVideo className="h-4 w-4" />
                    Contenido
                    {(course.modulesCount ?? 0) > 0 && (
                      <span className="ml-1 rounded-full bg-black/20 px-1.5 font-mono text-[10px]">
                        {course.modulesCount}M · {course.lessonsCount}C
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing({ ...course })}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(course)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}

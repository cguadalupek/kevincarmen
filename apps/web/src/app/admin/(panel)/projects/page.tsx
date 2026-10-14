'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FolderKanban,
  FolderTree,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSubNav } from '@/components/admin/admin-subnav';
import { PostEditor } from '@/components/admin/post-editor';
import { api, type ApiProject, type ApiProjectCategory } from '@/lib/api/client';

const STATUS_LABELS = {
  IN_PROGRESS: 'En desarrollo',
  COMPLETED: 'Completado',
  ARCHIVED: 'Archivado',
  ACTIVE: 'Activo',
} as const;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

const inputClass =
  'w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
const labelClass = 'mb-2 block text-sm font-medium';

interface ProjectDraft {
  id?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  status: ApiProject['status'];
  featured: boolean;
  projectYear: number | null;
  technologies: string[];
  /** Id de la clasificación elegida ('' = sin clasificación). */
  projectCategoryId: string;
  position: number | null;
  tags: string[];
  repository: string;
  demo: string;
  documentation: string;
  coverImage: string;
  gallery: string[];
}

function emptyProject(): ProjectDraft {
  return {
    title: '',
    slug: '',
    description: '',
    content: '',
    status: 'IN_PROGRESS',
    featured: false,
    projectYear: new Date().getFullYear(),
    technologies: [],
    projectCategoryId: '',
    position: null,
    tags: [],
    repository: '',
    demo: '',
    documentation: '',
    coverImage: '',
    gallery: [],
  };
}

function toDraft(item: ApiProject): ProjectDraft {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    content: item.content ?? '',
    status: item.status,
    featured: item.featured,
    projectYear: item.projectYear,
    technologies: item.technologies,
    projectCategoryId: item.projectCategory?.id ?? '',
    position: item.position ?? null,
    tags: item.tags,
    repository: item.repository ?? '',
    demo: item.demo ?? '',
    documentation: item.documentation ?? '',
    coverImage: item.coverImage ?? '',
    gallery: item.gallery ?? [],
  };
}

/** Mueve el elemento `index` una posición arriba/abajo; `null` si se sale de la lista. */
function move<T>(list: T[], index: number, delta: -1 | 1): T[] | null {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [categories, setCategories] = useState<ApiProjectCategory[]>([]);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [techInput, setTechInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    Promise.all([api.getProjects(), api.getProjectCategories()])
      .then(([projectList, categoryList]) => {
        setProjects(projectList);
        setCategories(categoryList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar proyectos'))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function handleTitleChange(value: string) {
    update('title', value);
    if (autoSlug) update('slug', slugify(value));
  }

  function newProject() {
    setDraft(emptyProject());
    setTechInput('');
    setTagsInput('');
    setAutoSlug(true);
    setError('');
  }

  function editProject(item: ApiProject) {
    setDraft(toDraft(item));
    setTechInput(item.technologies.join(', '));
    setTagsInput(item.tags.join(', '));
    setAutoSlug(false);
    setError('');
  }

  async function uploadCover(file: File) {
    setCoverUploading(true);
    setError('');
    try {
      const result = await api.uploadImage(file);
      update('coverImage', result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir la portada');
    } finally {
      setCoverUploading(false);
    }
  }

  async function uploadGalleryFiles(files: FileList | File[]) {
    setGalleryUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        try {
          urls.push((await api.uploadImage(file)).url);
        } catch {
          // las imágenes que fallen se saltan y el resto se sube igual
        }
      }
      update('gallery', [...(draft?.gallery ?? []), ...urls]);
    } finally {
      setGalleryUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.coverImage.trim()) {
      setError('La imagen de portada es obligatoria.');
      return;
    }
    setSaving(true);
    setError('');
    const list = (v: string) =>
      v
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim(),
      content: draft.content.trim(),
      status: draft.status,
      featured: draft.featured,
      projectYear: draft.projectYear ? Number(draft.projectYear) : undefined,
      technologies: list(techInput),
      projectCategoryId: draft.projectCategoryId,
      position: draft.position ?? undefined,
      tags: list(tagsInput),
      repository: draft.repository.trim() || undefined,
      demo: draft.demo.trim() || undefined,
      documentation: draft.documentation.trim() || undefined,
      coverImage: draft.coverImage.trim(),
      gallery: draft.gallery,
    };
    try {
      if (draft.id) await api.updateProject(draft.id, payload);
      else await api.createProject(payload);
      setDraft(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: ApiProject) {
    if (!window.confirm(`¿Eliminar el proyecto "${item.title}"?`)) return;
    try {
      await api.deleteProject(item.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  /**
   * Reordenar con las flechas ↑↓: se manda el array COMPLETO ya intercambiado y el API
   * renumera (`position` 10, 20, 30…). El mismo orden es el que ve el visitante en
   * /proyectos y el que decide qué destacados entran primero en la portada.
   */
  async function moveProject(index: number, delta: -1 | 1) {
    const next = move(projects, index, delta);
    if (!next) return;
    setReordering(true);
    setError('');
    try {
      setProjects(await api.reorderProjects(next.map((project) => project.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reordenar');
    } finally {
      setReordering(false);
    }
  }

  const categoryName = (item: ApiProject) => item.projectCategory?.name ?? item.category ?? null;

  return (
    <>
      <AdminPageHeader
        title="Proyectos"
        subtitle="Casos de estudio técnicos profesionales."
        action={
          <Button variant="accent" onClick={newProject} disabled={!!draft}>
            <Plus className="h-4 w-4" /> Nuevo proyecto
          </Button>
        }
      />

      <AdminSubNav
        ariaLabel="Subsecciones de proyectos"
        items={[
          {
            key: 'proyectos',
            label: 'Proyectos',
            icon: <FolderKanban className="h-4 w-4 shrink-0" />,
            href: '/admin/projects',
            active: true,
            badge: projects.length,
          },
          {
            key: 'clasificacion',
            label: 'Clasificación',
            icon: <FolderTree className="h-4 w-4 shrink-0" />,
            href: '/admin/projects/clasificacion',
            badge: categories.length,
          },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {draft && (
        <form onSubmit={submit} className="glass-card mb-8 space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{draft.id ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
            <button type="button" onClick={() => setDraft(null)} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna principal: contenido */}
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <div>
                <label htmlFor="project-title" className={labelClass}>
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  id="project-title"
                  value={draft.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="Nombre del proyecto"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="project-slug" className={labelClass}>
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  id="project-slug"
                  value={draft.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    update('slug', e.target.value);
                  }}
                  required
                  placeholder="identificador-unico"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="project-description" className={labelClass}>
                  Descripción corta <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="project-description"
                  value={draft.description}
                  onChange={(e) => update('description', e.target.value)}
                  required
                  rows={3}
                  placeholder="Aparece en las tarjetas del portafolio (1-2 frases)."
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="project-content" className="text-sm font-medium">
                    Caso de estudio
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Escribe <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">/</kbd> para
                    insertar código o imágenes · arrastra o pega capturas (Ctrl+V)
                  </span>
                </div>
                <PostEditor
                  key={draft.id ?? `new-${draft.title}`}
                  content={draft.content}
                  onChange={(markdown) => update('content', markdown)}
                />
              </div>
            </div>

            {/* Columna lateral: metadatos */}
            <div className="min-w-0 space-y-4">
              <section className="glass-card p-5">
                <h3 className="mb-4 font-semibold">Publicación</h3>
                <label htmlFor="project-status" className={labelClass}>
                  Estado
                </label>
                <select
                  id="project-status"
                  value={draft.status}
                  onChange={(e) => update('status', e.target.value as ApiProject['status'])}
                  required
                  className={inputClass}
                >
                  {Object.entries(STATUS_LABELS)
                    .filter(([k]) => k !== 'ACTIVE')
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </select>
                <label htmlFor="project-year" className={`${labelClass} mt-4`}>
                  Año
                </label>
                <input
                  id="project-year"
                  type="number"
                  min="1900"
                  max="2100"
                  value={draft.projectYear ?? ''}
                  onChange={(e) =>
                    update('projectYear', e.target.value ? Number(e.target.value) : null)
                  }
                  className={inputClass}
                />
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(e) => update('featured', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-muted/50"
                  />
                  Proyecto destacado
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  La portada muestra hasta 6 destacados, en el orden de la lista.
                </p>
              </section>

              <section className="glass-card p-5">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">Clasificación</h3>
                  <Link
                    href="/admin/projects/clasificacion"
                    className="shrink-0 text-xs text-accent hover:underline"
                  >
                    Gestionar
                  </Link>
                </div>
                <label htmlFor="project-category" className={labelClass}>
                  Clasificación del proyecto
                </label>
                <select
                  id="project-category"
                  value={draft.projectCategoryId}
                  onChange={(e) => update('projectCategoryId', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin clasificación</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se crean y reordenan en «Clasificación». Alimentan el filtro de /proyectos.
                </p>
                <label htmlFor="project-tech" className={`${labelClass} mt-4`}>
                  Tecnologías
                </label>
                <input
                  id="project-tech"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Next.js, PostgreSQL, Docker"
                  className={inputClass}
                />
                <label htmlFor="project-tags" className={`${labelClass} mt-4`}>
                  Tags
                </label>
                <input
                  id="project-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="backend, despliegue"
                  className={inputClass}
                />
                <label htmlFor="project-position" className={`${labelClass} mt-4`}>
                  Orden
                </label>
                <input
                  id="project-position"
                  type="number"
                  min={0}
                  step={10}
                  value={draft.position ?? ''}
                  onChange={(e) =>
                    update('position', e.target.value === '' ? null : Number(e.target.value))
                  }
                  placeholder="Vacío = al final"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Menor número = primero. También puedes usar las flechas ↑ ↓ del listado.
                </p>
              </section>

              <section className="glass-card p-5">
                <h3 className="mb-4 font-semibold">Recursos</h3>
                <label htmlFor="project-repo" className={labelClass}>
                  Repositorio
                </label>
                <input
                  id="project-repo"
                  type="url"
                  value={draft.repository}
                  onChange={(e) => update('repository', e.target.value)}
                  placeholder="https://github.com/..."
                  className={inputClass}
                />
                <label htmlFor="project-demo" className={`${labelClass} mt-4`}>
                  Demo
                </label>
                <input
                  id="project-demo"
                  type="url"
                  value={draft.demo}
                  onChange={(e) => update('demo', e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
                <label htmlFor="project-docs" className={`${labelClass} mt-4`}>
                  Documentación
                </label>
                <input
                  id="project-docs"
                  type="url"
                  value={draft.documentation}
                  onChange={(e) => update('documentation', e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </section>

              <section className="glass-card p-5">
                <h3 className="mb-3 font-semibold">Imagen de portada</h3>
                {draft.coverImage && (
                  <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border">
                    <Image
                      src={draft.coverImage}
                      alt="Portada del proyecto"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <label className="block cursor-pointer rounded-lg border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  {coverUploading
                    ? 'Subiendo…'
                    : draft.coverImage
                      ? 'Cambiar portada'
                      : 'Subir portada'}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    disabled={coverUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadCover(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                {draft.coverImage && (
                  <button
                    type="button"
                    onClick={() => update('coverImage', '')}
                    className="mt-2 text-xs text-muted-foreground hover:text-red-400"
                  >
                    Quitar portada
                  </button>
                )}
              </section>

              <section className="glass-card p-5">
                <h3 className="mb-3 font-semibold">Galería</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={galleryUploading}
                >
                  <Upload className="h-4 w-4" />
                  {galleryUploading ? 'Subiendo…' : 'Añadir imágenes'}
                </Button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void uploadGalleryFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                {draft.gallery.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {draft.gallery.map((url, i) => (
                      <div key={url} className="relative">
                        <Image
                          src={url}
                          alt={`Galería ${i + 1}`}
                          width={160}
                          height={100}
                          className="h-20 w-full rounded object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              'gallery',
                              draft.gallery.filter((_, n) => n !== i),
                            )
                          }
                          className="absolute right-1 top-1 rounded bg-black/70 p-1"
                          aria-label={`Quitar imagen ${i + 1}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <Button type="submit" variant="accent" className="w-full" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando…' : draft.id ? 'Actualizar proyecto' : 'Crear proyecto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setDraft(null)}
                >
                  Cancelar
                </Button>
              </section>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          Aún no hay proyectos. Crea el primero con «Nuevo proyecto».
        </div>
      ) : (
        <div className="space-y-3">
          {reordering && (
            <p className="text-xs text-muted-foreground">Guardando el nuevo orden…</p>
          )}
          {projects.map((item, index) => (
            <AdminListCard
              key={item.id}
              leading={
                item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    width={112}
                    height={64}
                    className="h-14 w-24 rounded-md border border-border object-cover sm:h-16 sm:w-28"
                    unoptimized
                  />
                ) : null
              }
              title={
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">{item.title}</span>
                </span>
              }
              badges={
                <>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                    {STATUS_LABELS[item.status]}
                  </span>
                  {item.featured && (
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      Destacado
                    </span>
                  )}
                  {categoryName(item) && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      <FolderKanban className="h-3 w-3" /> {categoryName(item)}
                    </span>
                  )}
                </>
              }
              meta={
                item.description ? <p className="line-clamp-2">{item.description}</p> : null
              }
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => moveProject(index, -1)}
                    disabled={index === 0 || reordering}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Mover ${item.title} antes`}
                    title="Mover antes"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProject(index, 1)}
                    disabled={index === projects.length - 1 || reordering}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Mover ${item.title} después`}
                    title="Mover después"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <Button variant="outline" size="sm" onClick={() => editProject(item)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => remove(item)}
                    className="text-red-400"
                  >
                    <Trash2 className="h-4 w-4" /> Quitar
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 text-foreground">
          <FolderTree className="h-3.5 w-3.5" /> Cómo funciona el orden
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Las flechas ↑ ↓ reordenan el listado y ese mismo orden es el del sitio público
            (/proyectos) y el de la sección «Proyectos destacados» de la portada.
          </li>
          <li>
            El número de la izquierda de cada fila es su posición real. Se renumera en múltiplos
            de 10 para poder insertar entre dos sin tocar el resto.
          </li>
          <li>
            «Destacado» decide si el proyecto entra en la portada (hasta 6, los primeros de la
            lista).
          </li>
          <li>
            Las clasificaciones («Software», «Web»…) ya no son fijas: se crean, renombran y
            reordenan en la subsección «Clasificación»; renombrar una actualiza los proyectos que
            la usan.
          </li>
        </ul>
      </div>
    </>
  );
}

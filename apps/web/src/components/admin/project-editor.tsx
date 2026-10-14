'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Save, Upload, X } from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { AdminModal } from '@/components/admin/admin-modal';
import { PostEditor } from '@/components/admin/post-editor';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from '@/components/admin/project-status';
import { api, type ApiProject, type ApiProjectCategory } from '@/lib/api/client';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

const inputClass =
  'w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
const labelClass = 'mb-2 block text-sm font-medium';

/** Formulario del proyecto, tal cual se manda al API. */
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

export interface ProjectEditorModalProps {
  /** `null` = proyecto nuevo; un proyecto = edición del existente. */
  project: ApiProject | null;
  categories: ApiProjectCategory[];
  onClose: () => void;
  /** Se llama tras guardar (el listado que lo abrió vuelve a cargar). */
  onSaved: () => void;
}

/**
 * Alta y edición de un proyecto en una vista superpuesta (`AdminModal`), igual que
 * el editor de clases de los cursos: la lista de abajo deja de estorbar (antes el
 * formulario se desplegaba al principio de la página y había que subir con el
 * scroll para editar un proyecto del final) y la cabecera y los botones
 * Guardar/Cancelar quedan fijos fuera del área de scroll.
 *
 * Se usa desde «Proyectos» y desde la vista por clasificación de «Clasificación»,
 * así que el proyecto llega por props y el formulario no depende de la página.
 */
export function ProjectEditorModal({
  project,
  categories,
  onClose,
  onSaved,
}: ProjectEditorModalProps) {
  const [draft, setDraft] = useState<ProjectDraft>(() =>
    project ? toDraft(project) : emptyProject(),
  );
  const [techInput, setTechInput] = useState(() => (project?.technologies ?? []).join(', '));
  const [tagsInput, setTagsInput] = useState(() => (project?.tags ?? []).join(', '));
  const [autoSlug, setAutoSlug] = useState(() => !project);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleTitleChange(value: string) {
    update('title', value);
    if (autoSlug) update('slug', slugify(value));
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
      update('gallery', [...draft.gallery, ...urls]);
    } finally {
      setGalleryUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
      setSaving(false);
    }
  }

  return (
    <AdminModal
      title={project ? 'Editar proyecto' : 'Nuevo proyecto'}
      subtitle={
        project
          ? `/${project.slug}`
          : 'Se añade al final del listado: usa las flechas ↑ ↓ para colocarlo.'
      }
      onClose={onClose}
      maxWidthClass="sm:max-w-6xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="project-form"
            variant="accent"
            className="w-full sm:w-auto"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando…' : project ? 'Actualizar proyecto' : 'Crear proyecto'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

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
              {/* `top-0`: dentro de la vista superpuesta el scroll arranca bajo la cabecera. */}
              <PostEditor
                key={project?.id ?? 'new'}
                content={draft.content}
                onChange={(markdown) => update('content', markdown)}
                toolbarTopClass="top-0"
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
                {PROJECT_STATUS_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {PROJECT_STATUS_LABELS[key]}
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
                onChange={(e) => update('projectYear', e.target.value ? Number(e.target.value) : null)}
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
          </div>
        </div>
      </form>
    </AdminModal>
  );
}

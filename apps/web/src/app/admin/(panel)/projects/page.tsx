'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ExternalLink,
  FolderKanban,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { PostEditor } from '@/components/admin/post-editor';
import { api, type ApiProject } from '@/lib/api/client';

const STATUS_LABELS = {
  IN_PROGRESS: 'En desarrollo',
  COMPLETED: 'Completado',
  ARCHIVED: 'Archivado',
  ACTIVE: 'Activo',
} as const;
const CATEGORIES = [
  'Software',
  'Web',
  'Infraestructura',
  'Automatización',
  'IA',
  'Homelab',
  'Otros',
];
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
  category: string;
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
    category: '',
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
    category: item.category ?? '',
    tags: item.tags,
    repository: item.repository ?? '',
    demo: item.demo ?? '',
    documentation: item.documentation ?? '',
    coverImage: item.coverImage ?? '',
    gallery: item.gallery ?? [],
  };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [techInput, setTechInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api
      .getProjects()
      .then(setProjects)
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
      category: draft.category.trim() || undefined,
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

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-muted-foreground">Casos de estudio técnicos profesionales.</p>
        </div>
        <Button variant="accent" onClick={newProject} disabled={!!draft}>
          <Plus className="h-4 w-4" /> Nuevo proyecto
        </Button>
      </div>

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
              </section>

              <section className="glass-card p-5">
                <h3 className="mb-4 font-semibold">Clasificación</h3>
                <label htmlFor="project-category" className={labelClass}>
                  Categoría
                </label>
                <select
                  id="project-category"
                  value={draft.category}
                  onChange={(e) => update('category', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
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
          {projects.map((item) => (
            <div key={item.id} className="glass-card flex items-center gap-4 p-4">
              {item.coverImage && (
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  width={112}
                  height={64}
                  className="h-16 w-28 shrink-0 rounded-md border border-border object-cover"
                  unoptimized
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{item.title}</span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    {STATUS_LABELS[item.status]}
                  </span>
                  {item.featured && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Destacado
                    </span>
                  )}
                  {item.category && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <FolderKanban className="h-3 w-3" /> {item.category}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

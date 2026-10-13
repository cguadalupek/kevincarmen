'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Eye,
  FileText,
  ImageIcon,
  ListVideo,
  FolderKanban,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { PostEditor } from '@/components/admin/post-editor';
import { ChipInput } from '@/components/admin/chip-input';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { api, type ApiLabExperiment } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface LabFormProps {
  experiment?: ApiLabExperiment;
}

const STATUS_LABELS = {
  IN_PROGRESS: 'En pruebas',
  SUCCESS: 'Funcionó',
  PARTIAL: 'Funcionó con limitaciones',
  FAILED: 'No funcionó',
  ABANDONED: 'Abandonado',
} as const;

const fieldClass =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
const cardTitle = 'font-semibold';

interface Chapter {
  time: string;
  title: string;
}

function isVideoUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    return (
      /youtube\.com|youtu\.be/.test(hostname) ||
      /vimeo\.com/.test(hostname) ||
      /tiktok\.com/.test(hostname) ||
      /\.(mp4|webm|ogg)$/i.test(pathname)
    );
  } catch {
    return false;
  }
}

/** Extrae los encabezados H2/H3 del Markdown para usarlos como capítulos. */
function chaptersFromContent(content: string): Chapter[] {
  return content
    .split('\n')
    .filter((line) => /^#{2,3}\s+/.test(line))
    .map((line) => ({ time: '', title: line.replace(/^#{2,3}\s+/, '').trim() }))
    .filter((chapter) => chapter.title.length > 0);
}

export function LabForm({ experiment }: LabFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  // ── Campos básicos ──
  const [title, setTitle] = useState(experiment?.title ?? '');
  const [slug, setSlug] = useState(experiment?.slug ?? '');
  const [autoSlug, setAutoSlug] = useState(!experiment);
  const [description, setDescription] = useState(experiment?.description ?? '');
  const [content, setContent] = useState(experiment?.content ?? '');

  // ── Publicación ──
  const [published, setPublished] = useState(experiment?.published ?? false);
  const [status, setStatus] = useState<ApiLabExperiment['status']>(
    experiment?.status ?? 'IN_PROGRESS',
  );
  const [startedAt, setStartedAt] = useState(experiment?.startedAt?.slice(0, 10) ?? '');
  const [completedAt, setCompletedAt] = useState(experiment?.completedAt?.slice(0, 10) ?? '');

  // ── Clasificación ──
  const [stack, setStack] = useState<string[]>(experiment?.stack ?? []);
  const [tags, setTags] = useState<string[]>(experiment?.tags ?? []);

  // ── Ficha rápida ──
  const [objective, setObjective] = useState(experiment?.objective ?? '');
  const [hypothesis, setHypothesis] = useState(experiment?.hypothesis ?? '');
  const [conclusion, setConclusion] = useState(experiment?.conclusion ?? '');

  // ── Video largo ──
  const [videoUrl, setVideoUrl] = useState(experiment?.videoUrl ?? '');
  const [videoDuration, setVideoDuration] = useState(
    experiment?.videoDuration ? String(experiment.videoDuration) : '',
  );
  const [chapters, setChapters] = useState<Chapter[]>(experiment?.chapters ?? []);
  const [copiedChapters, setCopiedChapters] = useState(false);

  // ── Contenido relacionado ──
  const [relatedPostId, setRelatedPostId] = useState(experiment?.relatedPostId ?? '');
  const [relatedProjectId, setRelatedProjectId] = useState(experiment?.relatedProjectId ?? '');
  const [postOptions, setPostOptions] = useState<{ id: string; title: string; status: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    api
      .getPosts()
      .then((posts) =>
        setPostOptions(
          posts
            .filter((post) => post.status === 'PUBLISHED')
            .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')),
        ),
      )
      .catch(() => undefined);
    api
      .getProjects()
      .then((projects) =>
        setProjectOptions(projects.filter((project) => project.status !== 'ARCHIVED')),
      )
      .catch(() => undefined);
  }, []);

  // ── Media ──
  const [coverImage, setCoverImage] = useState(experiment?.coverImage ?? '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [gallery, setGallery] = useState<string[]>(experiment?.gallery ?? []);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (autoSlug) setSlug(slugify(value));
  }

  function updateChapter(index: number, patch: Partial<Chapter>) {
    setChapters((current) =>
      current.map((chapter, i) => (i === index ? { ...chapter, ...patch } : chapter)),
    );
  }

  function addChaptersFromBody() {
    const existingTitles = new Set(chapters.map((chapter) => chapter.title.trim().toLowerCase()));
    const newChapters = chaptersFromContent(content).filter(
      (chapter) => !existingTitles.has(chapter.title.trim().toLowerCase()),
    );
    if (newChapters.length === 0) {
      setError('No encontré encabezados nuevos (## o ###) en el contenido.');
      return;
    }
    setError('');
    // Los capítulos generados van después de "Introducción" si existe.
    setChapters((current) => {
      const introIndex = current.findIndex((chapter) =>
        chapter.title.toLowerCase().includes('intro'),
      );
      if (introIndex === -1) return [...current, ...newChapters];
      const next = [...current];
      next.splice(introIndex + 1, 0, ...newChapters);
      return next;
    });
  }

  async function copyChapters() {
    const text = chapters
      .map((chapter) =>
        chapter.time.trim()
          ? `${chapter.time.trim()} ${chapter.title.trim()}`
          : chapter.title.trim(),
      )
      .filter(Boolean)
      .join('\n');
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedChapters(true);
    setTimeout(() => setCopiedChapters(false), 1800);
  }

  async function uploadCover(file: File) {
    setCoverUploading(true);
    setError('');
    try {
      const result = await api.uploadImage(file);
      setCoverImage(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la portada');
    } finally {
      setCoverUploading(false);
    }
  }

  async function uploadGallery(files: FileList) {
    setGalleryUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const result = await api.uploadImage(file);
        urls.push(result.url);
      }
      if (urls.length > 0) setGallery((current) => [...current, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imágenes');
    } finally {
      setGalleryUploading(false);
    }
  }

  function handleVideoUrlChange(value: string) {
    // El editor avisa al pegar CUALQUIER URL; aquí solo nos quedamos con las de video.
    if (!value || isVideoUrl(value)) setVideoUrl(value);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');

    const payload: Partial<ApiLabExperiment> = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      content,
      status,
      published,
      stack,
      tags,
      objective: objective.trim() || null,
      hypothesis: hypothesis.trim() || null,
      conclusion: conclusion.trim() || null,
      coverImage: coverImage.trim() || null,
      gallery,
      startedAt: startedAt || null,
      completedAt: completedAt || null,
      videoUrl: videoUrl.trim() || null,
      videoDuration: videoDuration.trim() ? Number.parseInt(videoDuration, 10) || null : null,
      chapters,
      relatedPostId: relatedPostId || null,
      relatedProjectId: relatedProjectId || null,
    };

    try {
      const saved = experiment
        ? await api.updateLabExperiment(experiment.id, payload)
        : await api.createLabExperiment(payload);
      await api.revalidateSite();
      setSavedSlug(saved.slug);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {savedSlug && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {published ? 'Experimento publicado.' : 'Borrador guardado.'}{' '}
          <Link
            href={`/lab/${savedSlug}`}
            className="font-medium text-accent underline underline-offset-2"
          >
            Ver en el sitio
          </Link>
          {' · '}
          <button
            type="button"
            className="font-medium text-accent underline underline-offset-2"
            onClick={() => router.push('/admin/lab')}
          >
            Volver al listado
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/lab"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
          >
            ← Experimentos
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            {experiment ? 'Editar experimento' : 'Nuevo experimento'}
          </h1>
        </div>
        <Button type="button" variant="outline" onClick={() => setPreview((value) => !value)}>
          <Eye className="h-4 w-4" />
          {preview ? 'Ocultar vista previa' : 'Vista previa'}
        </Button>
      </div>

      {preview && (
        <div className="rounded-xl border border-border bg-background p-8">
          <div className="mx-auto max-w-3xl">
            {title && <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>}
            {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
            {content ? (
              <MarkdownContent content={content} title={title} />
            ) : (
              <p className="mt-12 text-center text-sm text-muted-foreground">
                El cuerpo está vacío — escribe contenido para verlo aquí.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─────────── Columna principal ─────────── */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="lab-title" className="mb-2 block text-sm font-medium">
              Título
            </label>
            <input
              id="lab-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="Ej: Montar un cluster de Kubernetes en 3 raspberries"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="lab-slug" className="mb-2 block text-sm font-medium">
              Slug
            </label>
            <input
              id="lab-slug"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              placeholder="Se genera automáticamente del título"
              className={cn(fieldClass, 'font-mono')}
            />
          </div>

          <div>
            <label htmlFor="lab-description" className="mb-2 block text-sm font-medium">
              Resumen{' '}
              <span className="text-muted-foreground">(aparece en las tarjetas de /lab)</span>
            </label>
            <textarea
              id="lab-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Una o dos líneas: qué probaste y qué pasó."
              className={cn(fieldClass, 'resize-none')}
            />
          </div>

          <div>
            <label htmlFor="lab-content" className="mb-2 block text-sm font-medium">
              Contenido{' '}
              <span className="text-muted-foreground">
                (objetivo, entorno, procedimiento y resultados)
              </span>
            </label>
            <PostEditor
              content={content}
              onChange={setContent}
              onVideoPaste={handleVideoUrlChange}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Escribe <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">/</kbd> para
              insertar código, imágenes o videos. Arrastra o pega capturas (Ctrl+V). Marca los
              encabezados <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">##</kbd> que
              quieras usar como capítulos del video.
            </p>
          </div>
        </div>

        {/* ─────────── Columna lateral ─────────── */}
        <div className="min-w-0 space-y-4">
          <div className="glass-card space-y-3 p-5">
            <h3 className={cardTitle}>Publicación</h3>
            <label className="block text-sm font-medium">
              Visibilidad
              <select
                value={published ? 'PUBLISHED' : 'DRAFT'}
                onChange={(e) => setPublished(e.target.value === 'PUBLISHED')}
                className={cn(fieldClass, 'mt-1')}
              >
                <option value="DRAFT">Borrador (oculto en /lab)</option>
                <option value="PUBLISHED">Publicado (visible en /lab)</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Resultado
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApiLabExperiment['status'])}
                className={cn(fieldClass, 'mt-1')}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Inicio
                </span>
                <input
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  className={cn(fieldClass, 'mt-1')}
                />
              </label>
              <label className="block text-sm font-medium">
                Fin
                <input
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className={cn(fieldClass, 'mt-1')}
                />
              </label>
            </div>
          </div>

          <div className="glass-card space-y-3 p-5">
            <h3 className="flex items-center gap-2">
              <Video className="h-4 w-4 text-accent" /> Video largo (10–20 min)
            </h3>
            <label className="block text-sm font-medium">
              URL de YouTube / Vimeo
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className={cn(fieldClass, 'mt-1')}
              />
            </label>
            <label className="block text-sm font-medium">
              Duración aproximada (minutos)
              <input
                type="number"
                min={1}
                max={120}
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
                placeholder="18"
                className={cn(fieldClass, 'mt-1')}
              />
            </label>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <ListVideo className="h-3.5 w-3.5 text-muted-foreground" /> Capítulos
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={addChaptersFromBody}
                    title="Generar desde los encabezados del contenido"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-accent"
                  >
                    <Wand2 className="h-3 w-3" /> Desde el contenido
                  </button>
                  <button
                    type="button"
                    onClick={copyChapters}
                    disabled={chapters.length === 0}
                    title="Copiar para la descripción de YouTube"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-accent disabled:opacity-50"
                  >
                    {copiedChapters ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copiar
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {chapters.length === 0 && (
                  <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Sin capítulos. Pulsa «Desde el contenido» para generarlos de los encabezados.
                  </p>
                )}
                {chapters.map((chapter, index) => (
                  <div key={index} className="flex gap-1.5">
                    <input
                      value={chapter.time}
                      onChange={(e) => updateChapter(index, { time: e.target.value })}
                      placeholder="00:00"
                      className={cn(fieldClass, 'w-20 font-mono')}
                      aria-label="Tiempo del capítulo"
                    />
                    <input
                      value={chapter.title}
                      onChange={(e) => updateChapter(index, { title: e.target.value })}
                      placeholder="Título del capítulo"
                      className={fieldClass}
                      aria-label="Título del capítulo"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setChapters((current) => current.filter((_, i) => i !== index))
                      }
                      aria-label="Quitar capítulo"
                      className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setChapters((current) => [...current, { time: '', title: '' }])}
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Plus className="h-3 w-3" /> Agregar capítulo
                </button>
              </div>
            </div>
            {videoUrl && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {chapters.length > 0
                  ? `${chapters.length} capítulos · copia el bloque para la descripción de YouTube`
                  : 'Añade capítulos: serán enlaces directos en la página pública'}
              </p>
            )}
          </div>

          <div className="glass-card space-y-3 p-5">
            <h3 className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" /> Ficha rápida (opcional)
            </h3>
            <p className="text-xs text-muted-foreground">
              Aparecen como tarjetas destacadas arriba del contenido.
            </p>
            <label className="block text-sm font-medium">
              Objetivo
              <textarea
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className={cn(fieldClass, 'mt-1 resize-none')}
              />
            </label>
            <label className="block text-sm font-medium">
              Hipótesis
              <textarea
                rows={2}
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                className={cn(fieldClass, 'mt-1 resize-none')}
              />
            </label>
            <label className="block text-sm font-medium">
              Conclusión
              <textarea
                rows={2}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className={cn(fieldClass, 'mt-1 resize-none')}
              />
            </label>
          </div>

          <div className="glass-card space-y-3 p-5">
            <h3 className={cardTitle}>Clasificación</h3>
            <ChipInput
              label="Stack / tecnologías"
              value={stack}
              onChange={setStack}
              placeholder="Docker, Proxmox, PostgreSQL…"
            />
            <ChipInput
              label="Tags"
              value={tags}
              onChange={setTags}
              placeholder="homelab, virtualización…"
            />
          </div>

          <div className="glass-card space-y-3 p-5">
            <h3 className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-accent" /> Contenido relacionado
            </h3>
            <p className="text-xs text-muted-foreground">
              Aparece como enlace al final del experimento en /lab.
            </p>
            <label className="block text-sm font-medium">
              Artículo del blog
              <select
                value={relatedPostId}
                onChange={(e) => setRelatedPostId(e.target.value)}
                className={cn(fieldClass, 'mt-1')}
              >
                <option value="">Sin artículo</option>
                {postOptions.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Proyecto
              <select
                value={relatedProjectId}
                onChange={(e) => setRelatedProjectId(e.target.value)}
                className={cn(fieldClass, 'mt-1')}
              >
                <option value="">Sin proyecto</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="glass-card space-y-3 p-5">
            <h3 className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-accent" /> Portada
            </h3>
            {coverImage && (
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                <Image
                  src={coverImage}
                  alt="Portada del experimento"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="URL o sube una imagen"
                className={fieldClass}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => coverRef.current?.click()}
                disabled={coverUploading}
              >
                <Upload className="h-4 w-4" />
                {coverUploading ? '…' : 'Subir'}
              </Button>
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
            />
          </div>

          <div className="glass-card space-y-3 p-5">
            <h3 className={cardTitle}>Galería de evidencias</h3>
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((url) => (
                  <div
                    key={url}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                  >
                    <Image
                      src={url}
                      alt="Evidencia del experimento"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setGallery((current) => current.filter((item) => item !== url))
                      }
                      aria-label="Quitar imagen"
                      className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={galleryRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && uploadGallery(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => galleryRef.current?.click()}
              disabled={galleryUploading}
            >
              <Plus className="h-4 w-4" />
              {galleryUploading ? 'Subiendo…' : 'Agregar imágenes'}
            </Button>
          </div>

          <div className="glass-card flex flex-col gap-2 p-5">
            <Button type="submit" variant="accent" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? 'Guardando…' : experiment ? 'Guardar cambios' : 'Crear experimento'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/lab')}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

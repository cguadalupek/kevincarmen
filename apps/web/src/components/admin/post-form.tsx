'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, ExternalLink, Link2, Save, Video, X } from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { PostEditor } from '@/components/admin/post-editor';
import { api, type ApiPost, type ApiCategory, type VideoTypeValue } from '@/lib/api/client';

interface PostFormProps {
  post?: ApiPost;
}

const VIDEO_TYPE_OPTIONS: { value: VideoTypeValue; label: string }[] = [
  { value: 'YOUTUBE', label: 'YouTube (video completo)' },
  { value: 'YOUTUBE_SHORT', label: 'YouTube Short' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'X (Twitter)' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'GENERIC', label: 'Archivo / Otro' },
];

function detectVideoType(url: string): VideoTypeValue | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const path = parsed.pathname;
    if (/youtube\.com\/shorts\//.test(url) || /youtube\.com\/embed\/shorts/.test(url)) {
      return 'YOUTUBE_SHORT';
    }
    if (/youtube\.com|youtu\.be/.test(hostname)) return 'YOUTUBE';
    if (/tiktok\.com/.test(hostname)) return 'TIKTOK';
    if (/twitter\.com|x\.com/.test(hostname)) return 'TWITTER';
    if (/vimeo\.com/.test(hostname)) return 'VIMEO';
    if (/\.(mp4|webm|ogg)$/i.test(path)) return 'GENERIC';
  } catch {
    // ignore
  }
  return null;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [status, setStatus] = useState<ApiPost['status']>(post?.status ?? 'PUBLISHED');
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!post);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string>(
    post?.publishedAt
      ? new Date(post.publishedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? '');
  const [videoUrl, setVideoUrl] = useState(post?.videoUrl ?? '');
  const [videoType, setVideoType] = useState<VideoTypeValue | null>(
    post?.videoType ?? null,
  );
  const [externalLinkLabel, setExternalLinkLabel] = useState(post?.externalLinkLabel ?? '');
  const [externalLinkUrl, setExternalLinkUrl] = useState(post?.externalLinkUrl ?? '');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (autoSlug) setSlug(slugify(value));
  }

  function handleVideoUrlChange(value: string) {
    setVideoUrl(value);
    if (value) {
      const detected = detectVideoType(value);
      if (detected) setVideoType(detected);
    } else {
      setVideoType(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        status,
        coverImage: coverImage || undefined,
        videoUrl: videoUrl.trim() || undefined,
        videoType: videoType ?? undefined,
        externalLinkLabel: externalLinkLabel.trim() || undefined,
        externalLinkUrl: externalLinkUrl.trim() || undefined,
        categoryId: categoryId || undefined,
        publishedAt: new Date(publishedAt).toISOString(),
      };
      const saved = post
        ? await api.updatePost(post.id, payload)
        : await api.createPost(payload);

      await api.revalidateSite(saved.slug);

      if (status === 'PUBLISHED') {
        setSavedSlug(saved.slug);
        router.refresh();
        return;
      }

      router.push('/admin/posts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  async function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const result = await api.uploadImage(file);
      setCoverImage(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la portada');
    } finally {
      setCoverUploading(false);
      event.target.value = '';
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {savedSlug && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Artículo publicado.{' '}
          <a
            href={`/blog/${savedSlug}`}
            className="font-medium text-accent underline underline-offset-2"
          >
            Ver en el blog
          </a>
          {' · '}
          <button
            type="button"
            className="font-medium text-accent underline underline-offset-2"
            onClick={() => router.push('/admin/posts')}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              Título
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-medium">
              Slug
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              required
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 font-mono text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="mb-2 block text-sm font-medium">
              Extracto
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium">
              Contenido
            </label>
            <PostEditor content={content} onChange={setContent} videoUrl={videoUrl} onVideoPaste={handleVideoUrlChange} />
            <p className="mt-2 text-xs text-muted-foreground">
              Escribe <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">/</kbd> para insertar
              código o imágenes. Arrastra, pega capturas (Ctrl+V) o redimensiona imágenes como en
              Notion.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="mb-4 font-semibold">Publicación</h3>
            <label htmlFor="status" className="mb-2 block text-sm font-medium">
              Estado
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApiPost['status'])}
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="SCHEDULED">Programado</option>
              <option value="TRASHED">Papelera</option>
            </select>

            <label htmlFor="publishedAt" className="mt-4 mb-2 block text-sm font-medium">
              Fecha de publicación
            </label>
            <input
              id="publishedAt"
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <label htmlFor="categoryId" className="mt-4 mb-2 block text-sm font-medium">
              Categoría
            </label>
            <div className="relative">
              <select
                id="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-3 font-semibold">Video asociado</h3>
            <label htmlFor="videoUrl" className="mb-2 block text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Video className="h-4 w-4 text-accent" /> URL de YouTube, Short, TikTok, X o Vimeo
              </span>
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(event) => handleVideoUrlChange(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {videoUrl && (
              <div className="mt-3 space-y-3 rounded-md border border-border bg-card/40 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="break-all text-accent hover:underline">
                    {videoUrl}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="videoType" className="text-xs text-muted-foreground">
                    Tipo
                  </label>
                  <select
                    id="videoType"
                    value={videoType ?? ''}
                    onChange={(event) => setVideoType((event.target.value || null) as VideoTypeValue | null)}
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="">Auto</option>
                    {VIDEO_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {videoUrl && (
              <button
                type="button"
                onClick={() => {
                  setVideoUrl('');
                  setVideoType(null);
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400"
              >
                <X className="h-3 w-3" /> Quitar video
              </button>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-3 font-semibold">Imagen de portada</h3>
            {coverImage && (
              <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border">
                <Image src={coverImage} alt="Portada del artículo" fill className="object-cover" unoptimized />
              </div>
            )}
            <label className="block cursor-pointer rounded-lg border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent">
              {coverUploading ? 'Subiendo portada...' : coverImage ? 'Cambiar portada' : 'Subir portada / thumbnail'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleCoverChange}
                disabled={coverUploading}
              />
            </label>
            {coverImage && (
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground hover:text-red-400"
                onClick={() => setCoverImage('')}
              >
                Quitar portada
              </button>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-3 font-semibold">Enlace externo</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Enlace adicional que se mostrará en la publicación del artículo (por ejemplo: Demo,
              Repositorio, Fuente).
            </p>
            <label htmlFor="externalLinkLabel" className="mb-2 block text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Link2 className="h-4 w-4 text-accent" /> Etiqueta
              </span>
            </label>
            <input
              id="externalLinkLabel"
              type="text"
              value={externalLinkLabel}
              onChange={(event) => setExternalLinkLabel(event.target.value)}
              placeholder="Ver demo"
              maxLength={60}
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <label htmlFor="externalLinkUrl" className="mt-4 mb-2 block text-sm font-medium">
              URL
            </label>
            <input
              id="externalLinkUrl"
              type="url"
              value={externalLinkUrl}
              onChange={(event) => setExternalLinkUrl(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {externalLinkUrl && (
              <div className="mt-3 space-y-3 rounded-md border border-border bg-card/40 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <a
                    href={externalLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-accent hover:underline"
                  >
                    {externalLinkLabel || externalLinkUrl}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExternalLinkUrl('');
                    setExternalLinkLabel('');
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400"
                >
                  <X className="h-3 w-3" /> Quitar enlace
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Imágenes en tutoriales</p>
            <p className="mt-2">
              Solo los artículos con estado <strong className="text-foreground">Publicado</strong>{' '}
              aparecen en el blog público.
            </p>
            <p className="mt-2">
              Arrastra imágenes al editor, péguelas con Ctrl+V o usa{' '}
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">/imagen</kbd>
              . Redimensiona arrastrando las esquinas.
            </p>
          </div>

          <div className="glass-card p-5">
            <Button type="submit" variant="accent" className="w-full" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? 'Guardando...' : post ? 'Actualizar artículo' : 'Crear artículo'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

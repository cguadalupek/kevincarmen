'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { PostEditor } from '@/components/admin/post-editor';
import { api, type ApiPost } from '@/lib/api/client';

interface PostFormProps {
  post?: ApiPost;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [status, setStatus] = useState<ApiPost['status']>(post?.status ?? 'PUBLISHED');
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!post);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (autoSlug) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = { title, slug, excerpt, content, status, coverImage: coverImage || undefined };
      if (post) {
        await api.updatePost(post.id, data);
      } else {
        await api.createPost(data);
      }

      await api.revalidateSite(slug);

      if (status === 'PUBLISHED') {
        setSavedSlug(slug);
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
            <PostEditor content={content} onChange={setContent} />
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

            <div className="mt-6 flex flex-col gap-2">
              <Button type="submit" variant="accent" disabled={loading}>
                {loading ? 'Guardando...' : post ? 'Actualizar' : 'Crear artículo'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
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
              <button type="button" className="mt-2 text-xs text-muted-foreground hover:text-red-400" onClick={() => setCoverImage('')}>
                Quitar portada
              </button>
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
        </div>
      </div>
    </form>
  );
}

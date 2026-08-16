'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Save, Trash2, Video, X } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api, type ApiVideo, type VideoTypeValue } from '@/lib/api/client';

const VIDEO_PROVIDER_OPTIONS: { value: VideoTypeValue; label: string }[] = [
  { value: 'YOUTUBE', label: 'YouTube (video completo)' },
  { value: 'YOUTUBE_SHORT', label: 'YouTube Short' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'X (Twitter)' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'ODYSEE', label: 'Odysee' },
  { value: 'GENERIC', label: 'Archivo / Otro' },
];

function detectVideoType(url: string): VideoTypeValue | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (/youtube\.com\/shorts\//.test(url) || /youtube\.com\/embed\/shorts/.test(url)) {
      return 'YOUTUBE_SHORT';
    }
    if (/youtube\.com|youtu\.be/.test(hostname)) return 'YOUTUBE';
    if (/tiktok\.com/.test(hostname)) return 'TIKTOK';
    if (/twitter\.com|x\.com/.test(hostname)) return 'TWITTER';
    if (/vimeo\.com/.test(hostname)) return 'VIMEO';
    if (/odysee\.com/.test(hostname)) return 'ODYSEE';
    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return 'GENERIC';
  } catch {
    // ignore
  }
  return null;
}

function emptyVideo(): Partial<ApiVideo> {
  return {
    title: '',
    url: '',
    videoType: 'YOUTUBE',
    description: '',
    thumbnail: '',
    isShort: false,
    featured: false,
    position: 0,
  };
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<ApiVideo> | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .getVideos()
      .then(setVideos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar videos'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(emptyVideo());
  }

  function openEdit(video: ApiVideo) {
    setEditing({ ...video });
  }

  function closeForm() {
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');

    const payload: Partial<ApiVideo> = {
      title: (editing.title ?? '').trim(),
      url: (editing.url ?? '').trim(),
      videoType:
        editing.videoType ??
        (editing.url ? detectVideoType(editing.url) : null) ??
        'YOUTUBE',
      description: editing.description?.trim() || null,
      thumbnail: editing.thumbnail?.trim() || null,
      isShort: editing.isShort ?? editing.videoType === 'YOUTUBE_SHORT',
      featured: editing.featured ?? false,
      position: editing.position ?? 0,
    };

    try {
      if (editing.id) {
        await api.updateVideo(editing.id, payload);
      } else {
        await api.createVideo(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(video: ApiVideo) {
    if (!window.confirm(`¿Eliminar el video "${video.title}"?`)) return;
    try {
      await api.deleteVideo(video.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Videos del inicio</h1>
            <p className="text-sm text-muted-foreground">
              Aparecen en la sección "Últimos videos" del home y pueden retirarse cuando quieras.
            </p>
          </div>
          <Button variant="accent" onClick={openCreate} disabled={!!editing}>
            <Plus className="h-4 w-4" /> Nuevo video
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {editing && (
          <form
            onSubmit={handleSubmit}
            className="glass-card mb-6 space-y-4 p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {editing.id ? 'Editar video' : 'Nuevo video'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar formulario"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="video-title" className="mb-1 block text-sm font-medium">
                Título
              </label>
              <input
                id="video-title"
                value={editing.title ?? ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="video-url" className="mb-1 block text-sm font-medium">
                URL
              </label>
              <input
                id="video-url"
                type="url"
                value={editing.url ?? ''}
                onChange={(e) => {
                  const url = e.target.value;
                  const detected = detectVideoType(url);
                  setEditing({
                    ...editing,
                    url,
                    videoType: detected ?? editing.videoType ?? 'YOUTUBE',
                  });
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Al pegar la URL detectamos automáticamente el proveedor, pero puedes ajustarlo en el
                selector inferior antes de guardar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="video-type" className="mb-1 block text-sm font-medium">
                  Proveedor / tipo
                </label>
                <select
                  id="video-type"
                  value={editing.videoType ?? 'YOUTUBE'}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      videoType: e.target.value as VideoTypeValue,
                      isShort: e.target.value === 'YOUTUBE_SHORT',
                    })
                  }
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  {VIDEO_PROVIDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="video-position" className="mb-1 block text-sm font-medium">
                  Posición
                </label>
                <input
                  id="video-position"
                  type="number"
                  value={editing.position ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, position: Number.parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.isShort ?? false}
                  onChange={(e) => setEditing({ ...editing, isShort: e.target.checked })}
                  className="h-4 w-4 rounded border-border bg-muted/50"
                />
                Short
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.featured ?? false}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-border bg-muted/50"
                />
                Destacado (aparece primero en el home)
              </label>
            </div>

            <div>
              <label htmlFor="video-description" className="mb-1 block text-sm font-medium">
                Descripción (opcional)
              </label>
              <textarea
                id="video-description"
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="video-thumbnail" className="mb-1 block text-sm font-medium">
                Miniatura personalizada (opcional)
              </label>
              <input
                id="video-thumbnail"
                type="url"
                value={editing.thumbnail ?? ''}
                onChange={(e) => setEditing({ ...editing, thumbnail: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="accent" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : editing.id ? 'Actualizar video' : 'Crear video'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            <Video className="mx-auto h-10 w-10 opacity-50" />
            <p className="mt-3">Aún no agregaste videos al home.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="glass-card flex items-center gap-4 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{video.title}</span>
                    {video.featured && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                        Destacado
                      </span>
                    )}
                    {video.isShort && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-accent">
                        Short
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {video.videoType}
                    </span>
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all text-xs text-muted-foreground hover:text-accent"
                  >
                    {video.url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(video)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(video)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminAuthGuard>
  );
}
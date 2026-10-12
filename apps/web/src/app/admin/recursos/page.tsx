'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { ChipInput } from '@/components/admin/chip-input';
import { api, type ApiResource, type ApiResourceType } from '@/lib/api/client';
import { formatDate } from '@kevincarmen/utils';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: { value: ApiResourceType; label: string }[] = [
  { value: 'SCRIPT', label: 'Script' },
  { value: 'TEMPLATE', label: 'Plantilla' },
  { value: 'DOCKER', label: 'Docker / Compose' },
  { value: 'CHECKLIST', label: 'Checklist' },
  { value: 'GUIDE', label: 'Guía / PDF' },
  { value: 'DATASET', label: 'Dataset' },
  { value: 'OTHER', label: 'Otro' },
];

const fieldClass =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

function emptyResource(): Partial<ApiResource> {
  return {
    title: '',
    description: '',
    type: 'SCRIPT',
    fileUrl: '',
    fileName: '',
    fileSize: null,
    version: '',
    tags: [],
    published: true,
    featured: false,
    position: 0,
  };
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ApiResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<ApiResource> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api
      .getResources()
      .then(setResources)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar recursos'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(emptyResource());
    setAutoSlug(true);
    setError('');
  }

  function openEdit(resource: ApiResource) {
    setEditing({ ...resource });
    setAutoSlug(false);
    setError('');
  }

  function closeForm() {
    setEditing(null);
    setError('');
  }

  function update(key: keyof ApiResource, value: unknown) {
    setEditing((current) => (current ? { ...current, [key]: value } : current));
  }

  function handleTitleChange(value: string) {
    update('title', value);
    if (autoSlug) update('slug', slugify(value));
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    try {
      const result = await api.uploadFile(file);
      update('fileUrl', result.url);
      update('fileName', result.fileName);
      update('fileSize', result.size);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');

    const payload: Partial<ApiResource> = {
      title: (editing.title ?? '').trim(),
      slug: (editing.slug ?? '').trim() || undefined,
      description: (editing.description ?? '').trim(),
      type: editing.type ?? 'SCRIPT',
      fileUrl: (editing.fileUrl ?? '').trim() || null,
      fileName: (editing.fileName ?? '').trim() || null,
      fileSize: editing.fileSize ?? null,
      version: (editing.version ?? '').trim() || null,
      tags: editing.tags ?? [],
      published: editing.published ?? true,
      featured: editing.featured ?? false,
      position: editing.position ?? 0,
    };

    try {
      if (editing.id) {
        await api.updateResource(editing.id, payload);
      } else {
        await api.createResource(payload);
      }
      await api.revalidateSite();
      closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resource: ApiResource) {
    if (!window.confirm(`¿Eliminar el recurso "${resource.title}"?`)) return;
    try {
      await api.deleteResource(resource.id);
      await api.revalidateSite();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function copyDownloadLink(resource: ApiResource) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/api/v1/resources/${resource.slug}/download`,
    );
    setCopiedSlug(resource.id);
    setTimeout(() => setCopiedSlug(null), 1500);
  }

  const typeLabel = (type: ApiResourceType) =>
    TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;

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
            <h1 className="mt-2 text-2xl font-bold">Recursos</h1>
            <p className="text-sm text-muted-foreground">
              Scripts, plantillas y descargas de la sección pública /recursos.
            </p>
          </div>
          <Button variant="accent" onClick={openCreate} disabled={!!editing}>
            <Plus className="h-4 w-4" /> Nuevo recurso
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {editing && (
          <form onSubmit={handleSubmit} className="glass-card mb-6 space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing.id ? 'Editar recurso' : 'Nuevo recurso'}</h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Título
                <input
                  value={editing.title ?? ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="Ej: Backup script de Proxmox"
                  className={cn(fieldClass, 'mt-1')}
                />
              </label>
              <label className="block text-sm font-medium">
                Slug
                <input
                  value={editing.slug ?? ''}
                  onChange={(e) => {
                    setAutoSlug(false);
                    update('slug', e.target.value);
                  }}
                  placeholder="Auto"
                  className={cn(fieldClass, 'mt-1 font-mono')}
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Descripción
              <textarea
                value={editing.description ?? ''}
                onChange={(e) => update('description', e.target.value)}
                required
                rows={2}
                className={cn(fieldClass, 'mt-1 resize-none')}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Tipo
                <select
                  value={editing.type ?? 'SCRIPT'}
                  onChange={(e) => update('type', e.target.value as ApiResourceType)}
                  className={cn(fieldClass, 'mt-1')}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Versión
                <input
                  value={editing.version ?? ''}
                  onChange={(e) => update('version', e.target.value)}
                  placeholder="1.0"
                  className={cn(fieldClass, 'mt-1')}
                />
              </label>
              <label className="block text-sm font-medium">
                Posición
                <input
                  type="number"
                  value={editing.position ?? 0}
                  onChange={(e) => update('position', Number.parseInt(e.target.value, 10) || 0)}
                  className={cn(fieldClass, 'mt-1')}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Archivo descargable</p>
                <div className="flex gap-2">
                  <input
                    value={editing.fileUrl ?? ''}
                    onChange={(e) => update('fileUrl', e.target.value)}
                    placeholder="/uploads/… o https://…"
                    className={fieldClass}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? '…' : 'Subir'}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {(editing.fileName || editing.fileSize) && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {editing.fileName}{' '}
                    {editing.fileSize ? `· ${formatBytes(editing.fileSize)}` : ''}
                  </p>
                )}
              </div>
              <label className="block text-sm font-medium">
                Nombre visible del archivo
                <input
                  value={editing.fileName ?? ''}
                  onChange={(e) => update('fileName', e.target.value)}
                  placeholder="backup-proxmox.sh"
                  className={cn(fieldClass, 'mt-1 font-mono')}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.published ?? true}
                  onChange={(e) => update('published', e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-muted/50"
                />
                Publicado (visible en /recursos)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.featured ?? false}
                  onChange={(e) => update('featured', e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-muted/50"
                />
                Destacado (aparece primero)
              </label>
            </div>

            <ChipInput
              label="Tags"
              value={editing.tags ?? []}
              onChange={(tags) => update('tags', tags)}
              placeholder="proxmox, backup…"
            />

            <div className="flex gap-3">
              <Button type="submit" variant="accent" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Guardando…' : editing.id ? 'Actualizar recurso' : 'Crear recurso'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : resources.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-14 text-center text-muted-foreground">
            <p>Aún no hay recursos.</p>
            <Button variant="accent" className="mt-4" onClick={openCreate}>
              Crear el primero
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="glass-card flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{resource.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {typeLabel(resource.type)}
                    </span>
                    {resource.featured && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                        Destacado
                      </span>
                    )}
                    {!resource.published && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Oculto
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {resource.downloads} descargas
                    </span>
                    {resource.fileSize ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {formatBytes(resource.fileSize)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    /recursos · actualizado {formatDate(resource.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyDownloadLink(resource)}>
                    {copiedSlug === resource.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedSlug === resource.id ? 'Copiado' : 'Enlace'}
                  </Button>
                  {resource.fileUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/api/v1/resources/${resource.slug}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" /> Probar
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(resource)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resource)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
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

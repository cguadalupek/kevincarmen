'use client';

import { useRef, useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { slugify } from '@kevincarmen/utils';
import { Button } from '@/components/ui/button';
import { AdminModal } from '@/components/admin/admin-modal';
import { ChipInput } from '@/components/admin/chip-input';
import { api, type ApiResource, type ApiResourceTypeItem } from '@/lib/api/client';
import { resourceIcon } from '@/lib/resource-icons';

const fieldClass =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

function emptyResource(): Partial<ApiResource> {
  return {
    title: '',
    description: '',
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

export interface ResourceEditorModalProps {
  /** `null` = recurso nuevo; un recurso = edición del existente. */
  resource: ApiResource | null;
  /** Tipos creados en «Recursos › Tipos» (alimentan el desplegable «Tipo»). */
  types: ApiResourceTypeItem[];
  onClose: () => void;
  /** Se llama tras guardar (el listado que lo abrió vuelve a cargar). */
  onSaved: () => void;
}

/**
 * Alta y edición de un recurso en una vista superpuesta (`AdminModal`), igual que los
 * proyectos: la lista de abajo deja de estorbar (antes el formulario se desplegaba
 * encima del listado) y la cabecera y los botones Guardar/Cancelar quedan fijos fuera
 * del área de scroll.
 *
 * El desplegable «Tipo» se llena con los tipos del panel (`Recursos › Tipos`), no con
 * una lista fija en el código.
 */
export function ResourceEditorModal({
  resource,
  types,
  onClose,
  onSaved,
}: ResourceEditorModalProps) {
  const [draft, setDraft] = useState<Partial<ApiResource>>(() =>
    resource ? { ...resource } : emptyResource(),
  );
  const [autoSlug, setAutoSlug] = useState(() => !resource);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function update(key: keyof ApiResource, value: unknown) {
    setDraft((current) => ({ ...current, [key]: value }));
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
    setSaving(true);
    setError('');

    const payload: Partial<ApiResource> = {
      title: (draft.title ?? '').trim(),
      slug: (draft.slug ?? '').trim() || undefined,
      description: (draft.description ?? '').trim(),
      // Vacío = recurso sin tipo; el API lo desenlaza.
      resourceTypeId: draft.resourceType?.id ?? '',
      fileUrl: (draft.fileUrl ?? '').trim() || null,
      fileName: (draft.fileName ?? '').trim() || null,
      fileSize: draft.fileSize ?? null,
      version: (draft.version ?? '').trim() || null,
      tags: draft.tags ?? [],
      published: draft.published ?? true,
      featured: draft.featured ?? false,
      position: draft.position ?? 0,
    };

    try {
      if (draft.id) await api.updateResource(draft.id, payload);
      else await api.createResource(payload);
      await api.revalidateSite();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
    }
  }

  /** Tipos del desplegable: los del panel. Si el recurso trae uno que ya no existe,
   *  se añade igualmente para no perderlo al guardar. */
  const options = [...types];
  const current = draft.resourceType ?? null;
  if (current && !options.some((type) => type.id === current.id)) {
    options.push({ ...current, description: null, position: 0, resourcesCount: 0 });
  }

  return (
    <AdminModal
      title={resource ? 'Editar recurso' : 'Nuevo recurso'}
      subtitle={
        resource ? `/${resource.slug}` : 'Se añade al final del listado; el orden es el del sitio.'
      }
      onClose={onClose}
      maxWidthClass="sm:max-w-3xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="resource-form"
            variant="accent"
            className="w-full sm:w-auto"
            disabled={saving || uploading}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando…' : resource ? 'Actualizar recurso' : 'Crear recurso'}
          </Button>
        </>
      }
    >
      <form id="resource-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Título
            <input
              value={draft.title ?? ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="Ej: Backup script de Proxmox"
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="block text-sm font-medium">
            Slug
            <input
              value={draft.slug ?? ''}
              onChange={(e) => {
                setAutoSlug(false);
                update('slug', e.target.value);
              }}
              placeholder="Auto"
              className={`${fieldClass} mt-1 font-mono`}
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Descripción
          <textarea
            value={draft.description ?? ''}
            onChange={(e) => update('description', e.target.value)}
            required
            rows={2}
            className={`${fieldClass} mt-1 resize-none`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium">
            Tipo
            <select
              value={current?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                update('resourceType', options.find((type) => type.id === id) ?? null);
              }}
              className={`${fieldClass} mt-1`}
            >
              <option value="">Sin tipo</option>
              {options.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              Se crean y editan en «Tipos».
            </span>
          </label>
          <label className="block text-sm font-medium">
            Versión
            <input
              value={draft.version ?? ''}
              onChange={(e) => update('version', e.target.value)}
              placeholder="1.0"
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="block text-sm font-medium">
            Posición
            <input
              type="number"
              value={draft.position ?? 0}
              onChange={(e) => update('position', Number.parseInt(e.target.value, 10) || 0)}
              className={`${fieldClass} mt-1`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium">Archivo descargable</p>
            <div className="flex gap-2">
              <input
                value={draft.fileUrl ?? ''}
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
            {(draft.fileName || draft.fileSize) && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {draft.fileName} {draft.fileSize ? `· ${formatBytes(draft.fileSize)}` : ''}
              </p>
            )}
          </div>
          <label className="block text-sm font-medium">
            Nombre visible del archivo
            <input
              value={draft.fileName ?? ''}
              onChange={(e) => update('fileName', e.target.value)}
              placeholder="backup-proxmox.sh"
              className={`${fieldClass} mt-1 font-mono`}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.published ?? true}
              onChange={(e) => update('published', e.target.checked)}
              className="h-4 w-4 rounded border-border bg-muted/50"
            />
            Publicado (visible en /recursos)
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.featured ?? false}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 rounded border-border bg-muted/50"
            />
            Destacado (aparece primero)
          </label>
        </div>

        <ChipInput
          label="Tags"
          value={draft.tags ?? []}
          onChange={(tags) => update('tags', tags)}
          placeholder="proxmox, backup…"
        />

        {current && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {(() => {
              const Icon = resourceIcon(current.icon);
              return <Icon className="h-3.5 w-3.5 text-accent" />;
            })()}
            En /recursos se muestra con el icono del tipo «{current.name}».
          </p>
        )}
      </form>
    </AdminModal>
  );
}

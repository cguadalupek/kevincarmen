'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, FileCode, FolderArchive, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSubNav } from '@/components/admin/admin-subnav';
import { ResourceEditorModal } from '@/components/admin/resource-editor';
import { api, type ApiResource, type ApiResourceTypeItem } from '@/lib/api/client';
import { LEGACY_RESOURCE_TYPE_ICONS, LEGACY_RESOURCE_TYPE_LABELS } from '@/lib/api/resources';
import { resourceIcon } from '@/lib/resource-icons';
import { formatDate } from '@kevincarmen/utils';

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ApiResource[]>([]);
  const [types, setTypes] = useState<ApiResourceTypeItem[]>([]);
  /**
   * Editor en vista superpuesta (`ResourceEditorModal`): `undefined` = cerrado,
   * `null` = recurso nuevo, un recurso = edición del existente.
   */
  const [editor, setEditor] = useState<ApiResource | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getResources(), api.getResourceTypes()])
      .then(([resourceList, typeList]) => {
        setResources(resourceList);
        setTypes(typeList);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar recursos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  /** Nombre del tipo: el editable o, en recursos antiguos, el del enum legado. */
  const typeLabel = (resource: ApiResource) =>
    resource.resourceType?.name ?? LEGACY_RESOURCE_TYPE_LABELS[resource.type];

  return (
    <>
      <AdminPageHeader
        title="Recursos"
        subtitle="Scripts, plantillas y descargas de la sección pública /recursos."
        action={
          <Button variant="accent" onClick={() => setEditor(null)} disabled={editor !== undefined}>
            <Plus className="h-4 w-4" /> Nuevo recurso
          </Button>
        }
      />

      <AdminSubNav
        ariaLabel="Subsecciones de recursos"
        items={[
          {
            key: 'recursos',
            label: 'Recursos',
            icon: <FolderArchive className="h-4 w-4 shrink-0" />,
            href: '/admin/recursos',
            active: true,
            badge: resources.length,
          },
          {
            key: 'tipos',
            label: 'Tipos',
            icon: <FileCode className="h-4 w-4 shrink-0" />,
            href: '/admin/recursos/tipos',
            badge: types.length,
          },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* El alta y la edición se hacen en la vista superpuesta, sin tapar la lista. */}
      {editor !== undefined && (
        <ResourceEditorModal
          resource={editor}
          types={types}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            load();
          }}
        />
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 p-14 text-center text-muted-foreground">
          <p>Aún no hay recursos.</p>
          <Button variant="accent" className="mt-4" onClick={() => setEditor(null)}>
            Crear el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => {
            const Icon = resourceIcon(
              resource.resourceType?.icon ?? LEGACY_RESOURCE_TYPE_ICONS[resource.type],
            );
            return (
              <AdminListCard
                key={resource.id}
                leading={
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted sm:h-16 sm:w-16">
                    <Icon className="h-5 w-5 text-accent" />
                  </span>
                }
                title={resource.title}
                badges={
                  <>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {typeLabel(resource)}
                    </span>
                    {resource.featured && (
                      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                        Destacado
                      </span>
                    )}
                    {!resource.published && (
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        Oculto
                      </span>
                    )}
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {resource.downloads} descargas
                    </span>
                    {resource.fileSize ? (
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {formatBytes(resource.fileSize)}
                      </span>
                    ) : null}
                  </>
                }
                meta={
                  <>
                    {resource.description ? (
                      <p className="line-clamp-2">{resource.description}</p>
                    ) : null}
                    <p className="truncate font-mono">
                      /recursos · actualizado {formatDate(resource.updatedAt)}
                    </p>
                  </>
                }
                actions={
                  <>
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
                    <Button variant="outline" size="sm" onClick={() => setEditor(resource)}>
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
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Download, FileCode, Search, type LucideIcon } from 'lucide-react';
import {
  LEGACY_RESOURCE_TYPE_ICONS,
  LEGACY_RESOURCE_TYPE_LABELS,
  type PublicResource,
  type PublicResourceType,
} from '@/lib/api/resources';
import { FilterList } from '@/components/ui/filter-list';
import { resourceIcon } from '@/lib/resource-icons';

/** Clave del filtro de un recurso: su tipo editable o, si no lo tiene, el enum legado. */
function typeKey(resource: PublicResource): string {
  return resource.resourceType?.id ?? `legacy:${resource.type}`;
}

function typeLabel(resource: PublicResource): string {
  return resource.resourceType?.name ?? LEGACY_RESOURCE_TYPE_LABELS[resource.type];
}

function typeIcon(resource: PublicResource): LucideIcon {
  return resourceIcon(resource.resourceType?.icon ?? LEGACY_RESOURCE_TYPE_ICONS[resource.type]);
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceExplorer({
  resources,
  types,
}: {
  resources: PublicResource[];
  /** Tipos creados en el panel, en su orden (`position`). */
  types: PublicResourceType[];
}) {
  const [type, setType] = useState<string>('ALL');
  const [query, setQuery] = useState('');

  /**
   * Opciones del filtro: sólo los tipos que TIENEN recursos publicados (una opción
   * que lleva a «no hay nada» es un callejón sin salida), en el orden del panel.
   * Los recursos antiguos sin tipo enlazado se agrupan por su valor de enum.
   */
  const options = useMemo(() => {
    const seen = new Map<string, { count: number; label: string }>();
    for (const resource of resources) {
      const key = typeKey(resource);
      const current = seen.get(key);
      seen.set(key, {
        count: (current?.count ?? 0) + 1,
        label: current?.label ?? typeLabel(resource),
      });
    }

    const ranked = types
      .filter((entry) => seen.has(entry.id))
      .map((entry) => ({ value: entry.id, label: entry.name, count: seen.get(entry.id)?.count ?? 0 }));

    const known = new Set(ranked.map((entry) => entry.value));
    const leftovers = Array.from(seen.entries())
      .filter(([key]) => !known.has(key))
      .map(([value, entry]) => ({ value, label: entry.label, count: entry.count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    return [...ranked, ...leftovers];
  }, [resources, types]);

  // Si el tipo activo desaparece (se borró o se quedó sin recursos), vuelve a «Todos».
  const activeValue = type !== 'ALL' && !options.some((option) => option.value === type) ? 'ALL' : type;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (activeValue !== 'ALL' && typeKey(resource) !== activeValue) return false;
      if (!q) return true;
      return (
        resource.title.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q) ||
        typeLabel(resource).toLowerCase().includes(q) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [resources, activeValue, query]);

  return (
    <div>
      {/* Buscador + tipo: la lista estructurada de filtro del resto del sitio. */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar recurso…"
            aria-label="Buscar recursos"
            className="h-11 w-full rounded-xl border border-border bg-card/60 py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <FilterList
          className="w-full sm:w-80"
          label="Tipo"
          icon={<FileCode className="h-3.5 w-3.5" />}
          value={activeValue}
          allValue="ALL"
          allLabel="Todos los tipos"
          allCount={resources.length}
          options={options.map(({ value, label, count }) => ({ value, label, count }))}
          onSelect={setType}
          emptyLabel="Sin tipos"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          No hay recursos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {filtered.map((resource) => {
            const label = typeLabel(resource);
            const Icon = typeIcon(resource);
            const downloadUrl = `/api/v1/resources/${resource.slug}/download`;
            return (
              <article key={resource.id} className="glass-card group p-6 hover-lift">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-muted p-3">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{resource.title}</h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {label}
                      </span>
                      {resource.version && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
                          v{resource.version}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                    {(resource.tags.length > 0 || resource.fileSize) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {resource.tags.map((tag) => (
                          <span key={tag} className="font-mono text-xs text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                        {resource.fileSize && (
                          <span className="font-mono text-xs text-muted-foreground/70">
                            · {formatBytes(resource.fileSize)}
                          </span>
                        )}
                        <span className="font-mono text-xs text-muted-foreground/70">
                          · {resource.downloads} descargas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  {resource.fileUrl ? (
                    <a
                      href={downloadUrl}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">
                      <Download className="h-4 w-4" />
                      Próximamente
                    </span>
                  )}
                  {resource.fileName && (
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {resource.fileName}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

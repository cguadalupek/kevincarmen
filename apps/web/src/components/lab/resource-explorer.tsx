'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Container,
  Database,
  Download,
  FileCode,
  FileText,
  ListChecks,
  File as FileIcon,
  Search,
} from 'lucide-react';
import type { PublicResource, ResourceTypeValue } from '@/lib/api/resources';
import { cn } from '@/lib/utils';

const TYPE_META: Record<ResourceTypeValue, { label: string; icon: typeof FileCode }> = {
  SCRIPT: { label: 'Script', icon: FileCode },
  TEMPLATE: { label: 'Plantilla', icon: FileText },
  DOCKER: { label: 'Docker / Compose', icon: Container },
  CHECKLIST: { label: 'Checklist', icon: ListChecks },
  GUIDE: { label: 'Guía / PDF', icon: BookOpen },
  DATASET: { label: 'Dataset', icon: Database },
  OTHER: { label: 'Otro', icon: FileIcon },
};

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceExplorer({ resources }: { resources: PublicResource[] }) {
  const [type, setType] = useState<'ALL' | ResourceTypeValue>('ALL');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: resources.length };
    for (const resource of resources) result[resource.type] = (result[resource.type] ?? 0) + 1;
    return result;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (type !== 'ALL' && resource.type !== type) return false;
      if (!q) return true;
      return (
        resource.title.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [resources, type, query]);

  const filters: ('ALL' | ResourceTypeValue)[] = [
    'ALL',
    ...(Object.keys(TYPE_META) as ResourceTypeValue[]),
  ];

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar recurso…"
            className="w-64 rounded-lg border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                type === value
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground',
              )}
            >
              {value === 'ALL' ? 'Todos' : TYPE_META[value].label}
              <span className="ml-1.5 text-muted-foreground/70">{counts[value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          No hay recursos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {filtered.map((resource) => {
            const meta = TYPE_META[resource.type];
            const Icon = meta.icon;
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
                        {meta.label}
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

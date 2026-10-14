const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

/** Tipo legado (enum) de un recurso antiguo; los nuevos usan `resourceType`. */
export type ResourceTypeValue =
  | 'SCRIPT'
  | 'TEMPLATE'
  | 'DOCKER'
  | 'CHECKLIST'
  | 'GUIDE'
  | 'DATASET'
  | 'OTHER';

/** Tipo editable creado desde el panel (Recursos › Tipos). */
export interface PublicResourceType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  position: number;
  resourcesCount: number;
}

export interface PublicResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** Enum legado: respaldo cuando el recurso aún no tiene tipo enlazado. */
  type: ResourceTypeValue;
  /** Tipo editable (tabla `resource_types`); `null` en recursos sin enlazar. */
  resourceType: Omit<PublicResourceType, 'position' | 'resourcesCount'> | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  version: string | null;
  tags: string[];
  published: boolean;
  featured: boolean;
  position: number;
  downloads: number;
  createdAt: string;
}

export async function getResources(): Promise<PublicResource[]> {
  const response = await fetch(`${API_URL}/resources`, { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudieron cargar los recursos');
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Tipos de recurso del panel, en su orden (`position`). Alimentan el filtro de
 * /recursos: la lista muestra los tipos EN USO, en este orden.
 */
export async function getResourceTypes(): Promise<PublicResourceType[]> {
  try {
    const response = await fetch(`${API_URL}/resources/types`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as PublicResourceType[]) : [];
  } catch {
    return [];
  }
}

/** Rótulos del enum legado (respaldo de los recursos antiguos sin tipo enlazado). */
export const LEGACY_RESOURCE_TYPE_LABELS: Record<ResourceTypeValue, string> = {
  SCRIPT: 'Script',
  TEMPLATE: 'Plantilla',
  DOCKER: 'Docker / Compose',
  CHECKLIST: 'Checklist',
  GUIDE: 'Guía / PDF',
  DATASET: 'Dataset',
  OTHER: 'Otro',
};

/** Clave del icono del enum legado. */
export const LEGACY_RESOURCE_TYPE_ICONS: Record<ResourceTypeValue, string> = {
  SCRIPT: 'file-code',
  TEMPLATE: 'file-text',
  DOCKER: 'container',
  CHECKLIST: 'list-checks',
  GUIDE: 'book-open',
  DATASET: 'database',
  OTHER: 'file',
};

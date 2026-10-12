const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type ResourceTypeValue =
  'SCRIPT' | 'TEMPLATE' | 'DOCKER' | 'CHECKLIST' | 'GUIDE' | 'DATASET' | 'OTHER';

export interface PublicResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: ResourceTypeValue;
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

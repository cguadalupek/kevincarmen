const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type PublicProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'IN_PROGRESS';

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  technologies: string[];
  repository: string | null;
  demo: string | null;
  status: PublicProjectStatus;
  featured: boolean;
  coverImage: string | null;
  publishedAt: string | null;
}

export async function getPublishedProjects(): Promise<PublicProject[]> {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as PublicProject[]) : [];
  } catch {
    return [];
  }
}
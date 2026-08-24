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
  category: string | null;
  tags: string[];
  projectYear: number | null;
  repository: string | null;
  demo: string | null;
  documentation: string | null;
  status: PublicProjectStatus;
  problem: string | null;
  solution: string | null;
  role: string | null;
  architecture: string | null;
  architectureImage: string | null;
  technicalDecisions: { title: string; description: string }[];
  challenges: { title: string; problem: string; solution: string }[];
  results: string | null;
  learnings: string | null;
  gallery: string[];
  featured: boolean;
  coverImage: string | null;
  publishedAt: string | null;
}

export async function getProjectBySlug(slug: string): Promise<PublicProject | null> {
  try {
    const response = await fetch(`${API_URL}/projects/${encodeURIComponent(slug)}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    return (await response.json()) as PublicProject;
  } catch {
    return null;
  }
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
const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type PublicProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'IN_PROGRESS';

/** Clasificación del proyecto (tabla editable desde el panel). */
export interface PublicProjectCategory {
  id: string;
  name: string;
  slug: string;
  position: number;
}

/** Clasificación con el número de proyectos publicados que la usan. */
export interface ProjectCategoryOption extends PublicProjectCategory {
  description: string | null;
  projectsCount: number;
}

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  content: string | null;
  technologies: string[];
  category: string | null;
  projectCategory: PublicProjectCategory | null;
  position: number;
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
  /** Tiempo de lectura estimado en minutos (nullable en la base de datos). */
  readingTime: number | null;
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

/** Clasificaciones creadas en el panel (ordenadas por `position`). */
export async function getProjectCategories(): Promise<ProjectCategoryOption[]> {
  try {
    const response = await fetch(`${API_URL}/projects/categories`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as ProjectCategoryOption[]) : [];
  } catch {
    return [];
  }
}

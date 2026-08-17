const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type ExperimentStatus = 'IN_PROGRESS' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'ABANDONED';

export interface PublicLabExperiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  objective: string | null;
  hypothesis: string | null;
  environment: string | null;
  procedure: string | null;
  status: ExperimentStatus;
  result: string | null;
  conclusion: string | null;
  stack: string[];
  tags: string[];
  coverImage: string | null;
  gallery: string[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchLab(path: string): Promise<PublicLabExperiment | PublicLabExperiment[]> {
  const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo cargar el experimento');
  return response.json();
}

export async function getLabExperiments() {
  const data = await fetchLab('/lab');
  return Array.isArray(data) ? data : [];
}

export async function getLabExperimentBySlug(slug: string) {
  try {
    const data = await fetchLab(`/lab/${encodeURIComponent(slug)}`);
    return Array.isArray(data) ? null : data;
  } catch {
    return null;
  }
}

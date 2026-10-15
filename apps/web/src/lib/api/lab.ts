const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

import type { LabMilestone } from '@/lib/lab-milestone';

export type ExperimentStatus = 'IN_PROGRESS' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'ABANDONED';

export interface PublicLabExperiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  objective: string | null;
  hypothesis: string | null;
  conclusion: string | null;
  status: ExperimentStatus;
  stack: string[];
  tags: string[];
  coverImage: string | null;
  gallery: string[];
  startedAt: string | null;
  completedAt: string | null;
  content: string;
  videoUrl: string | null;
  videoDuration: number | null;
  chapters: { time: string; title: string }[];
  milestones: LabMilestone[];
  readingTime: number;
  relatedPost: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  } | null;
  relatedProject: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchLab(path: string): Promise<PublicLabExperiment | PublicLabExperiment[]> {
  const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo cargar el experimento');
  return response.json();
}

export async function getLabExperiments(): Promise<PublicLabExperiment[]> {
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

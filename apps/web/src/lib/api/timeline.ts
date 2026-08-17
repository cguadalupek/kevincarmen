const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export const TIMELINE_CACHE_TAG = 'timeline';

export type TimelineEventType = 'EDUCATION' | 'WORK' | 'PROJECT' | 'ACHIEVEMENT';

export interface PublicTimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  type: TimelineEventType;
  position: number;
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...(init.headers ?? {}) },
    next: { tags: [TIMELINE_CACHE_TAG] },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getPublishedTimelineEvents(): Promise<PublicTimelineEvent[]> {
  try {
    const data = await fetchJson(`${API_URL}/timeline`);
    return Array.isArray(data) ? (data as PublicTimelineEvent[]) : [];
  } catch {
    return [];
  }
}
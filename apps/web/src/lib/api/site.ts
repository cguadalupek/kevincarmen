const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export const SITE_CACHE_TAG = 'site';

export interface SiteHero {
  name: string;
  tagline: string;
  roles: string[];
  description: string;
}

export interface SiteAbout {
  bio: string[];
  expertise: string[];
  nowTitle: string;
  nowItems: string[];
}

export interface PublicTechItem {
  id: string;
  name: string;
  position: number;
}

export interface PublicTechCategory {
  id: string;
  name: string;
  position: number;
  items: PublicTechItem[];
}

export interface SiteContent {
  hero: SiteHero;
  about: SiteAbout;
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...(init.headers ?? {}) },
    next: { tags: [SITE_CACHE_TAG] },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getSiteContent(): Promise<SiteContent | null> {
  try {
    const data = await fetchJson(`${API_URL}/site`);
    if (!data || typeof data !== 'object') return null;
    return data as SiteContent;
  } catch {
    return null;
  }
}

export async function getTechCategories(): Promise<PublicTechCategory[] | null> {
  try {
    const data = await fetchJson(`${API_URL}/tech`);
    return Array.isArray(data) ? (data as PublicTechCategory[]) : null;
  } catch {
    return null;
  }
}
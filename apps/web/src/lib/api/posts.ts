const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export const POSTS_CACHE_TAG = 'posts';
export const VIDEOS_CACHE_TAG = 'videos';
export const CATEGORIES_CACHE_TAG = 'categories';

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  videoUrl: string | null;
  videoType: 'YOUTUBE' | 'YOUTUBE_SHORT' | 'TIKTOK' | 'TWITTER' | 'VIMEO' | 'GENERIC' | null;
  externalLinkLabel: string | null;
  externalLinkUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readingTime: number;
  author: { id: string; name: string; avatar?: string | null };
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getPublishedPosts(options: { categorySlug?: string } = {}): Promise<PublicPost[]> {
  const params = options.categorySlug ? `?category=${encodeURIComponent(options.categorySlug)}` : '';
  const data = await fetchJson(`${API_URL}/posts${params}`);
  return Array.isArray(data) ? data : [];
}

export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  try {
    const data = await fetchJson(`${API_URL}/posts/${encodeURIComponent(slug)}`);
    return data;
  } catch {
    return null;
  }
}

export async function getLatestVideos(limit = 6): Promise<PublicPost[]> {
  try {
    const data = await fetchJson(`${API_URL}/posts/videos?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getBlogCategories(): Promise<PublicCategory[]> {
  try {
    const data = await fetchJson(`${API_URL}/posts/categories`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function mapPostToCard(post: PublicPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    publishedAt: post.publishedAt ?? post.id,
    readingTime: post.readingTime,
    categories: post.category ? [post.category] : [],
    tags: post.tags.map((t) => t.tag),
    author: post.author,
  };
}

export function categoryIcon(slug: string) {
  switch (slug) {
    case 'desarrollo':
      return 'Code2';
    case 'infraestructura':
      return 'Server';
    case 'redes':
      return 'Network';
    case 'hardware':
      return 'Cpu';
    case 'ia':
      return 'Sparkles';
    case 'soporte-ti':
      return 'Wrench';
    default:
      return 'Bookmark';
  }
}

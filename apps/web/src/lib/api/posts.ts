const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';

export const POSTS_CACHE_TAG = 'posts';

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  publishedAt: string | null;
  readingTime: number;
  author: { id: string; name: string; avatar?: string | null };
  category: { id: string; name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
}

async function fetchPosts(url: string): Promise<Response> {
  return fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    next: { tags: [POSTS_CACHE_TAG] },
  });
}

export async function getPublishedPosts(): Promise<PublicPost[]> {
  try {
    const res = await fetchPosts(`${API_URL}/posts`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  try {
    const res = await fetchPosts(`${API_URL}/posts/${slug}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

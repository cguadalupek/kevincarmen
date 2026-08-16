const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kc_token');
}

export function setToken(token: string) {
  localStorage.setItem('kc_token', token);
}

export function clearToken() {
  localStorage.removeItem('kc_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de servidor' }));
    throw new Error(error.message ?? `Error ${res.status}`);
  }

  return res.json();
}

export type VideoTypeValue = 'YOUTUBE' | 'YOUTUBE_SHORT' | 'TIKTOK' | 'TWITTER' | 'VIMEO' | 'GENERIC';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ApiPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  videoUrl: string | null;
  videoType: VideoTypeValue | null;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'TRASHED';
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
  categoryId: string | null;
  category: { id: string; slug: string; name: string } | null;
  author: { id: string; name: string };
}

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getPosts: () => apiFetch<ApiPost[]>('/posts/admin/all'),

  getPost: (id: string) => apiFetch<ApiPost>(`/posts/admin/${id}`),

  createPost: (data: Partial<ApiPost>) =>
    apiFetch<ApiPost>('/posts', { method: 'POST', body: JSON.stringify(data) }),

  updatePost: (id: string, data: Partial<ApiPost>) =>
    apiFetch<ApiPost>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePost: (id: string) =>
    apiFetch<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),

  getCategories: () => apiFetch<ApiCategory[]>('/posts/categories').catch(() => []),

  getLatestVideos: () =>
    apiFetch<ApiPost[]>('/posts/videos').catch(() => []),

  revalidateSite: async (slug?: string) => {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret':
          process.env.NEXT_PUBLIC_REVALIDATE_SECRET ?? 'kevincarmen-dev-secret',
      },
      body: JSON.stringify({ slug }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al revalidar caché' }));
      throw new Error(error.message ?? `Error al revalidar (${res.status})`);
    }

    return res.json() as Promise<{ revalidated: boolean; now: number }>;
  },

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al subir imagen' }));
      throw new Error(error.message ?? `Error ${res.status}`);
    }

    return res.json();
  },
};

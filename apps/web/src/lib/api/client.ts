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

export type VideoTypeValue =
  | 'YOUTUBE'
  | 'YOUTUBE_SHORT'
  | 'TIKTOK'
  | 'TWITTER'
  | 'VIMEO'
  | 'ODYSEE'
  | 'GENERIC';

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
  externalLinkLabel: string | null;
  externalLinkUrl: string | null;
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

export interface ApiVideo {
  id: string;
  title: string;
  url: string;
  videoType: VideoTypeValue;
  thumbnail: string | null;
  description: string | null;
  publishedAt: string;
  isShort: boolean;
  featured: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  lessonsCount: number;
  status: 'COMING_SOON' | 'AVAILABLE' | 'IN_PROGRESS' | 'ARCHIVED';
  coverImage: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLabExperiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  objective: string | null;
  hypothesis: string | null;
  environment: string | null;
  procedure: string | null;
  result: string | null;
  conclusion: string | null;
  stack: string[];
  tags: string[];
  status: 'IN_PROGRESS' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'ABANDONED';
  coverImage: string | null;
  gallery: string[];
  startedAt: string | null;
  completedAt: string | null;
  relatedPostId: string | null;
  relatedProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  technologies: string[];
  repository: string | null;
  demo: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'IN_PROGRESS';
  featured: boolean;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  type: 'EDUCATION' | 'WORK' | 'PROJECT' | 'ACHIEVEMENT';
  position: number;
  createdAt: string;
  updatedAt: string;
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
    apiFetch<ApiVideo[]>('/videos').catch(() => []),

  getVideos: () => apiFetch<ApiVideo[]>('/videos/admin/all'),
  createVideo: (data: Partial<ApiVideo>) =>
    apiFetch<ApiVideo>('/videos', { method: 'POST', body: JSON.stringify(data) }),
  updateVideo: (id: string, data: Partial<ApiVideo>) =>
    apiFetch<ApiVideo>(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVideo: (id: string) =>
    apiFetch<{ success: boolean }>(`/videos/${id}`, { method: 'DELETE' }),

  getCourses: () => apiFetch<ApiCourse[]>('/courses/admin/all'),
  createCourse: (data: Partial<ApiCourse>) =>
    apiFetch<ApiCourse>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: Partial<ApiCourse>) =>
    apiFetch<ApiCourse>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) =>
    apiFetch<{ success: boolean }>(`/courses/${id}`, { method: 'DELETE' }),

  getLabExperiments: () => apiFetch<ApiLabExperiment[]>('/lab/admin/all'),
  createLabExperiment: (data: Partial<ApiLabExperiment>) =>
    apiFetch<ApiLabExperiment>('/lab', { method: 'POST', body: JSON.stringify(data) }),
  updateLabExperiment: (id: string, data: Partial<ApiLabExperiment>) =>
    apiFetch<ApiLabExperiment>(`/lab/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabExperiment: (id: string) =>
    apiFetch<{ success: boolean }>(`/lab/${id}`, { method: 'DELETE' }),

  getProjects: () => apiFetch<ApiProject[]>('/projects/admin/all'),
  createProject: (data: Partial<ApiProject>) => apiFetch<ApiProject>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<ApiProject>) => apiFetch<ApiProject>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => apiFetch<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  getTimelineEvents: () => apiFetch<ApiTimelineEvent[]>('/timeline/admin/all'),
  createTimelineEvent: (data: Partial<ApiTimelineEvent>) =>
    apiFetch<ApiTimelineEvent>('/timeline', { method: 'POST', body: JSON.stringify(data) }),
  updateTimelineEvent: (id: string, data: Partial<ApiTimelineEvent>) =>
    apiFetch<ApiTimelineEvent>(`/timeline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimelineEvent: (id: string) =>
    apiFetch<{ success: boolean }>(`/timeline/${id}`, { method: 'DELETE' }),

  getSettings: () => apiFetch<Record<string, string>>('/settings'),
  saveSettings: (settings: Record<string, string>) =>
    apiFetch<Record<string, string>>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),

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

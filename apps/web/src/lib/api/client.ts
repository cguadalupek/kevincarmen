const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

import type { LabMilestone } from '@/lib/lab-milestone';

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
  'YOUTUBE' | 'YOUTUBE_SHORT' | 'TIKTOK' | 'TWITTER' | 'VIMEO' | 'ODYSEE' | 'GENERIC';

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
  featured: boolean;
  videoUrl: string | null;
  videoType: VideoTypeValue | null;
  externalLinkLabel: string | null;
  externalLinkUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'TRASHED';
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
  /** Id de la categoría principal (obligatorio). */
  mainCategoryId: string;
  mainCategory: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    position: number;
    color: string;
  };
  subCategoryId: string | null;
  subCategory: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    position: number;
  } | null;
  author: { id: string; name: string };
}

export interface ApiSubcategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
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

export type LessonTypeValue = 'VIDEO' | 'ARTICLE' | 'PRACTICE' | 'QUIZ';

export interface ApiLessonResource {
  label: string;
  url: string;
}

export interface ApiLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: LessonTypeValue;
  videoUrl: string | null;
  videoType: VideoTypeValue;
  content: string | null;
  duration: number;
  resources: ApiLessonResource[] | null;
  isFree: boolean;
  published: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCourseModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: ApiLesson[];
  createdAt: string;
  updatedAt: string;
}

/** Payload aceptado por PUT /courses/:id/curriculum (el backend completa el resto). */
export interface SaveCurriculumLesson {
  id?: string;
  title: string;
  slug?: string;
  description?: string | null;
  type?: LessonTypeValue;
  videoUrl?: string | null;
  videoType?: VideoTypeValue;
  content?: string | null;
  duration?: number;
  resources?: ApiLessonResource[] | null;
  isFree?: boolean;
  published?: boolean;
}

export interface SaveCurriculumModule {
  id?: string;
  title: string;
  description?: string | null;
  lessons: SaveCurriculumLesson[];
}

export interface ApiCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  subtitle: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  lessonsCount: number;
  modulesCount: number;
  totalMinutes: number;
  status: 'COMING_SOON' | 'AVAILABLE' | 'IN_PROGRESS' | 'ARCHIVED';
  coverImage: string | null;
  position: number;
  learningPoints: string[];
  requirements: string[];
  targetAudience: string | null;
  createdAt: string;
  updatedAt: string;
  modules: ApiCourseModule[];
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
  /** Cuerpo en Markdown (editor enriquecido). */
  content: string;
  /** Video largo que documenta el experimento. */
  videoUrl: string | null;
  /** Duración del video en minutos. */
  videoDuration: number | null;
  /** Capítulos del video: [{ time, title }]. */
  chapters: { time: string; title: string }[];
  /** Hitos interactivos de la ficha de laboratorio (timeline). */
  milestones: LabMilestone[];
  /** Borrador/Publicado: solo los publicados salen en /lab. */
  published: boolean;
  readingTime: number;
  /** Contenido relacionado resuelto por el API (solo público). */
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

/** Enum legado del tipo de recurso (los recursos nuevos usan `resourceType`). */
export type ApiResourceType =
  'SCRIPT' | 'TEMPLATE' | 'DOCKER' | 'CHECKLIST' | 'GUIDE' | 'DATASET' | 'OTHER';

/** Referencia del tipo editable incluida en un recurso. */
export interface ApiResourceTypeRef {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

/** Tipo de recurso editable del panel (Recursos › Tipos). */
export interface ApiResourceTypeItem extends ApiResourceTypeRef {
  description: string | null;
  position: number;
  /** Cuántos recursos usan este tipo. */
  resourcesCount: number;
}

export interface ApiResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** @deprecated enum legado: la fuente de verdad es `resourceType`. */
  type: ApiResourceType;
  /** Tipo editable (tabla `resource_types`). `null` si aún no tiene. */
  resourceType?: ApiResourceTypeRef | null;
  /** Id del tipo editable: lo que se manda al crear/editar ('' = sin tipo). */
  resourceTypeId?: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  version: string | null;
  tags: string[];
  published: boolean;
  featured: boolean;
  position: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProjectCategoryRef {
  id: string;
  name: string;
  slug: string;
  position: number;
}

/** Clasificación de proyectos del CMS (con cuántos proyectos la usan). */
export interface ApiProjectCategory extends ApiProjectCategoryRef {
  description: string | null;
  projectsCount: number;
}

export interface ApiProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  content: string | null;
  technologies: string[];
  category: string | null;
  /** Clasificación editable (tabla `project_categories`). */
  projectCategory: ApiProjectCategoryRef | null;
  /** Orden manual: menor número = primero en el sitio. */
  position: number;
  tags: string[];
  projectYear: number | null;
  repository: string | null;
  demo: string | null;
  documentation: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'IN_PROGRESS';
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
  createdAt: string;
  updatedAt: string;
}

export type TimelineEventTypeValue = 'EDUCATION' | 'WORK' | 'PROJECT' | 'ACHIEVEMENT';

export interface ApiTimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  type: TimelineEventTypeValue;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSiteHero {
  name: string;
  tagline: string;
  roles: string[];
  description: string;
}

export interface ApiSiteAbout {
  bio: string[];
  expertise: string[];
  nowTitle: string;
  nowItems: string[];
}

export interface ApiSiteContent {
  hero: ApiSiteHero;
  about: ApiSiteAbout;
}

export interface ApiTechItem {
  id: string;
  name: string;
  position: number;
}

export interface ApiTechCategory {
  id: string;
  name: string;
  position: number;
  items: ApiTechItem[];
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

  deletePost: (id: string) => apiFetch<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),

  getCategoryTree: () =>
    apiFetch<
      {
        id: string;
        value: string;
        label: string;
        description: string | null;
        position: number;
        color: string;
        subcategories: ApiSubcategory[];
      }[]
    >('/categories').catch(() => []),

  // ── CRUD de categorías y subcategorías (admin) ──
  createCategory: (data: {
    name: string;
    slug: string;
    description?: string;
    position?: number;
    color?: string;
  }) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description?: string;
      position?: number;
      color?: string;
    }>,
  ) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    apiFetch<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),
  createSubcategory: (data: {
    mainCategoryId: string;
    name: string;
    slug: string;
    description?: string;
    position?: number;
  }) =>
    apiFetch('/categories/subcategories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubcategory: (
    id: string,
    data: Partial<{
      mainCategoryId: string;
      name: string;
      slug: string;
      description?: string;
      position?: number;
    }>,
  ) =>
    apiFetch(`/categories/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSubcategory: (id: string) =>
    apiFetch<{ success: boolean }>(`/categories/subcategories/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Reordenamiento de la taxonomía del blog: el índice del array define la posición.
   * El API devuelve el árbol ya ordenado (para pintarlo sin recargar).
   */
  reorderCategories: (categoryIds: string[]) =>
    apiFetch<
      {
        id: string;
        value: string;
        label: string;
        description: string | null;
        position: number;
        color: string;
        subcategories: ApiSubcategory[];
      }[]
    >('/categories/reorder', { method: 'PUT', body: JSON.stringify({ categoryIds }) }),
  reorderSubcategories: (mainCategoryId: string, subcategoryIds: string[]) =>
    apiFetch<
      {
        id: string;
        value: string;
        label: string;
        description: string | null;
        position: number;
        color: string;
        subcategories: ApiSubcategory[];
      }[]
    >('/categories/subcategories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ mainCategoryId, subcategoryIds }),
    }),

  getLatestVideos: () => apiFetch<ApiVideo[]>('/videos').catch(() => []),

  getVideos: () => apiFetch<ApiVideo[]>('/videos/admin/all'),
  createVideo: (data: Partial<ApiVideo>) =>
    apiFetch<ApiVideo>('/videos', { method: 'POST', body: JSON.stringify(data) }),
  updateVideo: (id: string, data: Partial<ApiVideo>) =>
    apiFetch<ApiVideo>(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVideo: (id: string) =>
    apiFetch<{ success: boolean }>(`/videos/${id}`, { method: 'DELETE' }),

  getCourses: () => apiFetch<ApiCourse[]>('/courses/admin/all'),
  getCourseAdmin: (id: string) => apiFetch<ApiCourse>(`/courses/admin/${id}`),
  createCourse: (data: Partial<ApiCourse>) =>
    apiFetch<ApiCourse>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: Partial<ApiCourse>) =>
    apiFetch<ApiCourse>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  /** Guarda el árbol completo (módulos + clases) en una sola llamada. */
  saveCourseCurriculum: (id: string, modules: SaveCurriculumModule[]) =>
    apiFetch<ApiCourse>(`/courses/${id}/curriculum`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    }),
  deleteCourse: (id: string) =>
    apiFetch<{ success: boolean }>(`/courses/${id}`, { method: 'DELETE' }),

  getLabExperiments: () => apiFetch<ApiLabExperiment[]>('/lab/admin/all'),
  getLabExperiment: (id: string) => apiFetch<ApiLabExperiment>(`/lab/admin/${id}`),
  createLabExperiment: (data: Partial<ApiLabExperiment>) =>
    apiFetch<ApiLabExperiment>('/lab', { method: 'POST', body: JSON.stringify(data) }),
  updateLabExperiment: (id: string, data: Partial<ApiLabExperiment>) =>
    apiFetch<ApiLabExperiment>(`/lab/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabExperiment: (id: string) =>
    apiFetch<{ success: boolean }>(`/lab/${id}`, { method: 'DELETE' }),

  getResources: () => apiFetch<ApiResource[]>('/resources/admin/all'),
  createResource: (data: Partial<ApiResource>) =>
    apiFetch<ApiResource>('/resources', { method: 'POST', body: JSON.stringify(data) }),
  updateResource: (id: string, data: Partial<ApiResource>) =>
    apiFetch<ApiResource>(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResource: (id: string) =>
    apiFetch<{ success: boolean }>(`/resources/${id}`, { method: 'DELETE' }),

  // ── Tipos de recurso (subsección «Tipos») ──
  getResourceTypes: () => apiFetch<ApiResourceTypeItem[]>('/resources/types'),
  createResourceType: (data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    position?: number;
  }) =>
    apiFetch<ApiResourceTypeItem>('/resources/types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateResourceType: (
    id: string,
    data: { name?: string; slug?: string; description?: string; icon?: string; position?: number },
  ) =>
    apiFetch<ApiResourceTypeItem>(`/resources/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteResourceType: (id: string) =>
    apiFetch<{ success: boolean }>(`/resources/types/${id}`, { method: 'DELETE' }),
  reorderResourceTypes: (typeIds: string[]) =>
    apiFetch<ApiResourceTypeItem[]>('/resources/types/reorder', {
      method: 'PUT',
      body: JSON.stringify({ typeIds }),
    }),

  getProjects: () => apiFetch<ApiProject[]>('/projects/admin/all'),
  createProject: (data: Partial<ApiProject>) =>
    apiFetch<ApiProject>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<ApiProject>) =>
    apiFetch<ApiProject>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    apiFetch<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  /** Reordena los proyectos del panel: el índice del array define la posición. */
  reorderProjects: (projectIds: string[]) =>
    apiFetch<ApiProject[]>('/projects/reorder', {
      method: 'PUT',
      body: JSON.stringify({ projectIds }),
    }),

  // ── Clasificaciones de proyectos (subsección «Clasificación») ──
  getProjectCategories: () => apiFetch<ApiProjectCategory[]>('/projects/categories'),
  createProjectCategory: (data: {
    name: string;
    slug?: string;
    description?: string;
    position?: number;
  }) =>
    apiFetch<ApiProjectCategory>('/projects/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProjectCategory: (
    id: string,
    data: { name?: string; slug?: string; description?: string; position?: number },
  ) =>
    apiFetch<ApiProjectCategory>(`/projects/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProjectCategory: (id: string) =>
    apiFetch<{ success: boolean }>(`/projects/categories/${id}`, { method: 'DELETE' }),
  reorderProjectCategories: (categoryIds: string[]) =>
    apiFetch<ApiProjectCategory[]>('/projects/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ categoryIds }),
    }),
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

  getSiteContent: () => apiFetch<ApiSiteContent>('/site'),
  saveSiteContent: (data: Partial<ApiSiteContent>) =>
    apiFetch<ApiSiteContent>('/site', { method: 'PUT', body: JSON.stringify(data) }),
  getTech: () => apiFetch<ApiTechCategory[]>('/tech'),
  createTechCategory: (name: string) =>
    apiFetch<ApiTechCategory>('/tech/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateTechCategory: (id: string, name: string) =>
    apiFetch<ApiTechCategory>(`/tech/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  deleteTechCategory: (id: string) =>
    apiFetch<{ success: boolean }>(`/tech/categories/${id}`, { method: 'DELETE' }),
  createTechItem: (name: string, categoryId: string) =>
    apiFetch<ApiTechItem>('/tech/items', { method: 'POST', body: JSON.stringify({ name, categoryId }) }),
  updateTechItem: (id: string, data: { name?: string; categoryId?: string }) =>
    apiFetch<ApiTechItem>(`/tech/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTechItem: (id: string) =>
    apiFetch<{ success: boolean }>(`/tech/items/${id}`, { method: 'DELETE' }),
  reorderTech: (categoryIds?: string[], itemIds?: string[]) =>
    apiFetch<ApiTechCategory[]>('/tech/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ categoryIds, itemIds }),
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

  /** Sube un archivo genérico (scripts, plantillas, PDFs...) para la sección Recursos. */
  uploadFile: async (file: File): Promise<{ url: string; fileName: string; size: number }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/media/upload-file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error al subir archivo' }));
      throw new Error(error.message ?? `Error ${res.status}`);
    }

    return res.json();
  },
};

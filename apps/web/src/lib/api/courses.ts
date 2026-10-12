const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export type PublicVideoType =
  | 'YOUTUBE'
  | 'YOUTUBE_SHORT'
  | 'TIKTOK'
  | 'TWITTER'
  | 'VIMEO'
  | 'ODYSEE'
  | 'GENERIC';

export type PublicLessonType = 'VIDEO' | 'ARTICLE' | 'PRACTICE' | 'QUIZ';

export interface PublicCourse {
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
  learningPoints: string[];
  requirements: string[];
  targetAudience: string | null;
  position: number;
  /** Ids de clases publicadas (para el progreso local del alumno). */
  lessonIds: string[];
}

export interface PublicLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: PublicLessonType;
  videoUrl: string | null;
  videoType: PublicVideoType;
  content: string | null;
  duration: number;
  resources: { label: string; url: string }[] | null;
  isFree: boolean;
  published: boolean;
  position: number;
}

export interface PublicModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: PublicLesson[];
}

export interface PublicCourseDetail extends PublicCourse {
  modules: PublicModule[];
  createdAt: string;
  updatedAt: string;
}

/** Clase plana con el contexto de su módulo (cómoda para el player). */
export interface FlattenedLesson extends PublicLesson {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
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

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  try {
    const data = await fetchJson(`${API_URL}/courses`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<PublicCourseDetail | null> {
  try {
    const data = await fetchJson(`${API_URL}/courses/${encodeURIComponent(slug)}`);
    if (!data || typeof data !== 'object') return null;
    return data as PublicCourseDetail;
  } catch {
    return null;
  }
}

/** Aplana módulo + clases en una lista ordenada con su contexto. */
export function flattenCurriculum(course: PublicCourseDetail): FlattenedLesson[] {
  return course.modules.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      moduleId: module.id,
      moduleTitle: module.title,
      moduleIndex,
      lessonIndex,
    })),
  );
}

/** Total de minutos del curso (suma de las clases publicadas). */
export function curriculumMinutes(course: PublicCourseDetail): number {
  return course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration || 0), 0),
    0,
  );
}

export function formatMinutes(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

/**
 * Sesión del ALUMNO (pública), separada de la del CMS.
 *
 * El token vive en `kc_student_token`, no en `kc_token`: si compartieran clave, un
 * estudiante que abriera el panel en el mismo navegador pisaría la sesión del dueño
 * (y al revés). Son dos sesiones independientes contra el mismo `/auth/login`.
 */
export const STUDENT_TOKEN_KEY = 'kc_student_token';
export const STUDENT_USER_KEY = 'kc_student_user';

/** Evento al iniciar/cerrar sesión: la cabecera se actualiza sin recargar. */
export const STUDENT_SESSION_EVENT = 'kc-student-session';

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ProgressRow {
  courseId: string;
  chapterId: string;
  completed: boolean;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: StudentUser;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getStudentToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(STUDENT_TOKEN_KEY);
}

export function getStudentUser(): StudentUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STUDENT_USER_KEY);
    return raw ? (JSON.parse(raw) as StudentUser) : null;
  } catch {
    return null;
  }
}

export function saveStudentSession(session: AuthSession) {
  window.localStorage.setItem(STUDENT_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(STUDENT_USER_KEY, JSON.stringify(session.user));
  window.dispatchEvent(new Event(STUDENT_SESSION_EVENT));
}

export function clearStudentSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STUDENT_TOKEN_KEY);
  window.localStorage.removeItem(STUDENT_USER_KEY);
  window.dispatchEvent(new Event(STUDENT_SESSION_EVENT));
}

async function studentFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStudentToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(error?.message)
      ? error.message.join(', ')
      : (error?.message ?? `Error ${res.status}`);
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Progreso del alumno con sesión (todas sus clases completadas). */
export function fetchCloudProgress() {
  return studentFetch<ProgressRow[]>('/progress/me');
}

/** Marca/desmarca una clase en la nube. */
export function saveCloudChapter(courseId: string, chapterId: string, completed: boolean) {
  return studentFetch<ProgressRow>('/progress', {
    method: 'PUT',
    body: JSON.stringify({ courseId, chapterId, completed }),
  });
}

/**
 * Fusión al entrar: sube el progreso local y devuelve la lista definitiva.
 * El servidor hace una UNIÓN (no pisa lo que ya tenía la cuenta).
 */
export function syncCloudProgress(
  items: { courseId: string; chapterId: string; completed?: boolean }[],
) {
  return studentFetch<ProgressRow[]>('/progress/sync', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

/** Reinicia el curso en la nube. */
export function resetCloudCourse(courseId: string) {
  return studentFetch<{ success: boolean; deleted: number }>(
    `/progress/${encodeURIComponent(courseId)}`,
    { method: 'DELETE' },
  );
}

export function loginStudent(email: string, password: string) {
  return studentFetch<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerStudent(name: string, email: string, password: string) {
  return studentFetch<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

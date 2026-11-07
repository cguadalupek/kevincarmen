/**
 * Progreso de cursos guardado en el navegador (invitados).
 *
 * Es la única fuente de verdad mientras el visitante no tiene cuenta: se lee y se
 * escribe en `localStorage` sin tocar el servidor. Al registrarse o iniciar sesión
 * ese progreso se sube una sola vez (`POST /progress/sync`, que hace una UNIÓN con
 * lo que ya hubiera en la nube) y a partir de ahí el espejo local se mantiene
 * sincronizado para que las tarjetas del catálogo puedan pintar la barra sin
 * pedir nada al API.
 *
 * Forma del almacén: `{ [courseId]: [chapterId, ...] }`. Solo se guardan las clases
 * completadas; la ausencia de un id significa «pendiente».
 */

export const LOCAL_PROGRESS_KEY = 'kc_course_progress_v1';

/** Evento que se emite al cambiar el progreso local (para sincronizar componentes). */
export const PROGRESS_EVENT = 'kc-course-progress';

/**
 * Los tres primeros capítulos de cualquier curso son de acceso libre y público.
 * El resto también se puede leer (modelo freemium NO intrusivo): lo que cambia es
 * que su progreso solo se conserva entre dispositivos con una cuenta.
 */
export const FREE_CHAPTER_COUNT = 3;

export type LocalProgressStore = Record<string, string[]>;

function isBrowser() {
  return typeof window !== 'undefined';
}

export function isFreeChapter(index: number) {
  return index < FREE_CHAPTER_COUNT;
}

/** Lee el almacén completo. Nunca lanza: un JSON corrupto se descarta. */
export function readLocalProgress(): LocalProgressStore {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const store: LocalProgressStore = {};
    for (const [courseId, chapterIds] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(chapterIds)) {
        store[courseId] = chapterIds.filter((id): id is string => typeof id === 'string');
      }
    }
    return store;
  } catch {
    return {};
  }
}

function writeLocalProgress(store: LocalProgressStore) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(store));
  } catch {
    // almacenamiento lleno o bloqueado (modo privado): el progreso no persiste
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/** Clases completadas de un curso. */
export function getLocalCourseProgress(courseId: string): string[] {
  return readLocalProgress()[courseId] ?? [];
}

/** Marca o desmarca una clase y devuelve el estado del curso ya actualizado. */
export function setLocalChapter(courseId: string, chapterId: string, completed: boolean) {
  const store = readLocalProgress();
  const current = new Set(store[courseId] ?? []);
  if (completed) current.add(chapterId);
  else current.delete(chapterId);

  if (current.size === 0) delete store[courseId];
  else store[courseId] = [...current];

  writeLocalProgress(store);
  return store[courseId] ?? [];
}

/** Reemplaza el almacén con lo que devuelve la nube (tras `sync` o `GET /me`). */
export function replaceLocalProgress(rows: { courseId: string; chapterId: string }[]) {
  const store: LocalProgressStore = {};
  for (const row of rows) {
    (store[row.courseId] ??= []).push(row.chapterId);
  }
  writeLocalProgress(store);
}

/** Borra el progreso local de un curso (reiniciar). */
export function clearLocalCourse(courseId: string) {
  const store = readLocalProgress();
  delete store[courseId];
  writeLocalProgress(store);
}

/** Todo el progreso local como ítems listos para `POST /progress/sync`. */
export function localProgressItems(): { courseId: string; chapterId: string; completed: true }[] {
  const store = readLocalProgress();
  return Object.entries(store).flatMap(([courseId, chapterIds]) =>
    chapterIds.map((chapterId) => ({ courseId, chapterId, completed: true as const })),
  );
}

/** Cuántas clases completadas del curso (contando solo ids que sigan existiendo). */
export function countLocalCompleted(courseId: string, chapterIds: string[]) {
  const done = new Set(getLocalCourseProgress(courseId));
  return chapterIds.filter((id) => done.has(id)).length;
}

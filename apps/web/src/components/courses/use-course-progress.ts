'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PROGRESS_EVENT,
  clearLocalCourse,
  getLocalCourseProgress,
  localProgressItems,
  replaceLocalProgress,
  setLocalChapter,
} from '@/lib/course-progress';
import {
  type StudentUser,
  fetchCloudProgress,
  getStudentToken,
  getStudentUser,
  resetCloudCourse,
  saveCloudChapter,
  syncCloudProgress,
} from '@/lib/api/progress';

/**
 * Progreso de UN curso, con dos orígenes y una sola forma de leerlo.
 *
 * - Invitado: `localStorage` (nada sale del navegador).
 * - Con cuenta: nube (`/progress/*`), y el resultado se espeja en `localStorage`
 *   para que el catálogo y las tarjetas pinten la barra sin llamar al API.
 *
 * La reconciliación al entrar es una UNIÓN: se sube lo que había en el navegador
 * que la nube aún no tenía (`sync`) y se adopta la lista resultante. Si el API no
 * responde (sin red), se sigue con el progreso local: nunca se pierde lo del
 * invitado por un fallo de red.
 */
export function useCourseProgress(courseId: string, chapterIds: string[]) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<StudentUser | null>(null);
  const [error, setError] = useState('');
  const [synced, setSynced] = useState(false);

  // 1) Primer render: lo que hay en el navegador (rápido y sin red).
  useEffect(() => {
    setCompleted(new Set(getLocalCourseProgress(courseId)));
    setUser(getStudentUser());
    setReady(true);
  }, [courseId]);

  // 2) Si hay sesión, la nube manda: se fusiona lo local una vez y se espeja.
  useEffect(() => {
    if (!getStudentToken()) return;
    let cancelled = false;

    (async () => {
      try {
        const local = localProgressItems();
        let rows = await fetchCloudProgress();
        const cloudKeys = new Set(rows.map((row) => `${row.courseId}:${row.chapterId}`));
        const pending = local.filter(
          (item) => !cloudKeys.has(`${item.courseId}:${item.chapterId}`),
        );
        if (pending.length > 0) rows = await syncCloudProgress(pending);
        if (cancelled) return;

        replaceLocalProgress(rows);
        setCompleted(
          new Set(
            rows
              .filter((row) => row.courseId === courseId && row.completed)
              .map((row) => row.chapterId),
          ),
        );
        setSynced(true);
      } catch {
        // Sin red o token caducado: se mantiene el progreso local.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // 3) Cambios hechos por otros componentes (hidratación del catálogo, otra pestaña).
  useEffect(() => {
    const handler = () => setCompleted(new Set(getLocalCourseProgress(courseId)));
    window.addEventListener(PROGRESS_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [courseId]);

  const toggle = useCallback(
    async (chapterId: string, next: boolean) => {
      setError('');
      // Optimista: la UI responde al instante aunque la red tarde.
      setCompleted((prev) => {
        const set = new Set(prev);
        if (next) set.add(chapterId);
        else set.delete(chapterId);
        return set;
      });
      setLocalChapter(courseId, chapterId, next);

      if (!getStudentToken()) return;
      try {
        await saveCloudChapter(courseId, chapterId, next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el progreso');
        // Revertir también el espejo local para que no quede una verdad partida.
        setLocalChapter(courseId, chapterId, !next);
      }
    },
    [courseId],
  );

  const reset = useCallback(async () => {
    setError('');
    clearLocalCourse(courseId);
    setCompleted(new Set());
    if (!getStudentToken()) return;
    try {
      await resetCloudCourse(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reiniciar el progreso');
    }
  }, [courseId]);

  const total = chapterIds.length;
  const done = chapterIds.filter((id) => completed.has(id)).length;

  return {
    completed,
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    ready,
    user,
    isAnonymous: !user,
    synced,
    error,
    toggle,
    reset,
  };
}

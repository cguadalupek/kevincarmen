'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Progreso del alumno por curso, guardado localmente en el navegador
 * (no hay cuentas de usuarios públicos: el progreso vive en el dispositivo,
 * igual que el "viendo" de cualquier plataforma sin login).
 */

const STORE_KEY = 'kc:course-progress:v1';

interface CourseProgressEntry {
  completed: string[];
  last: string | null;
}

type CourseProgressStore = Record<string, CourseProgressEntry>;

function readStore(): CourseProgressStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as CourseProgressStore) : {};
  } catch {
    return {};
  }
}

export function getCourseProgress(courseSlug: string): CourseProgressEntry {
  return readStore()[courseSlug] ?? { completed: [], last: null };
}

export function getResumeLessonSlug(courseSlug: string, fallback: string | null): string | null {
  const entry = getCourseProgress(courseSlug);
  return entry.last ?? fallback;
}

export function useCourseProgress(courseSlug: string, allLessonIds: string[]) {
  // Los valores reales se cargan tras el montaje: leer localStorage durante el
  // render de hidratación provocaría un mismatch (el SSR no tiene progreso).
  const [entry, setEntry] = useState<CourseProgressEntry>({ completed: [], last: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntry(getCourseProgress(courseSlug));
    setHydrated(true);
  }, [courseSlug]);

  // Sincroniza entre pestañas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setEntry(getCourseProgress(courseSlug));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [courseSlug]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      const store = readStore();
      store[courseSlug] = entry;
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      // almacenamiento no disponible: el progreso no persiste, no es crítico
    }
  }, [entry, courseSlug, hydrated]);

  const completedSet = useMemo(
    () => new Set(entry.completed.filter((id) => allLessonIds.includes(id))),
    [entry.completed, allLessonIds],
  );

  const isCompleted = useCallback(
    (lessonId: string) => completedSet.has(lessonId),
    [completedSet],
  );

  const markComplete = useCallback((lessonId: string, lessonSlug?: string) => {
    setEntry((prev) => {
      if (prev.completed.includes(lessonId)) return prev;
      return {
        completed: [...prev.completed, lessonId],
        last: lessonSlug ?? prev.last,
      };
    });
  }, []);

  const toggle = useCallback(
    (lessonId: string, lessonSlug: string) => {
      setEntry((prev) => {
        const completed = prev.completed.includes(lessonId)
          ? prev.completed.filter((id) => id !== lessonId)
          : [...prev.completed, lessonId];
        return { completed, last: lessonSlug };
      });
    },
    [],
  );

  const setLast = useCallback((lessonSlug: string) => {
    setEntry((prev) => ({ ...prev, last: lessonSlug }));
  }, []);

  const clear = useCallback(() => {
    setEntry({ completed: [], last: null });
  }, []);

  const completedCount = completedSet.size;
  const total = allLessonIds.length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const isComplete = total > 0 && completedCount === total;

  return {
    completed: completedSet,
    completedCount,
    total,
    percent,
    isComplete,
    last: entry.last,
    isCompleted,
    markComplete,
    toggle,
    setLast,
    clear,
  };
}
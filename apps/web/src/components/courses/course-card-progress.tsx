'use client';

import { useEffect, useState } from 'react';
import { PROGRESS_EVENT, countLocalCompleted } from '@/lib/course-progress';
import { CourseProgressBar } from '@/components/courses/course-progress-bar';

/**
 * Barra de progreso de la tarjeta del catálogo.
 *
 * Lee el espejo local (que el reproductor y `CourseProgressHydrator` mantienen al
 * día), así que no hace ninguna petición. Se pinta tras montar para no romper la
 * hidratación: el HTML del servidor no puede saber el progreso de este navegador.
 * Sin clases completadas no pinta nada (tarjeta limpia para quien no ha empezado).
 */
export function CourseCardProgress({
  courseId,
  lessonIds,
}: {
  courseId: string;
  lessonIds: string[];
}) {
  const [done, setDone] = useState<number | null>(null);
  const key = lessonIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    const update = () => setDone(countLocalCompleted(courseId, ids));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, [courseId, key]);

  if (!done || lessonIds.length === 0) return null;

  return <CourseProgressBar done={done} total={lessonIds.length} className="mt-3" label={false} />;
}

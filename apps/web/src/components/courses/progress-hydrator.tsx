'use client';

import { useEffect } from 'react';
import { fetchCloudProgress, getStudentToken } from '@/lib/api/progress';
import { replaceLocalProgress } from '@/lib/course-progress';

/**
 * Sin interfaz: si hay sesión de alumno, trae el progreso de la nube y lo espeja
 * en `localStorage`. Así las tarjetas del catálogo (que son client components y
 * solo leen el espejo) muestran la barra real de una cuenta sin pedir nada por
 * tarjeta: una sola petición por visita al listado.
 *
 * Si falla (sin red, token caducado) no hace nada: el espejo se queda como estaba.
 */
export function CourseProgressHydrator() {
  useEffect(() => {
    if (!getStudentToken()) return;
    let cancelled = false;
    fetchCloudProgress()
      .then((rows) => {
        if (!cancelled) replaceLocalProgress(rows);
      })
      .catch(() => {
        // silencio: el catálogo funciona igual con el progreso local
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

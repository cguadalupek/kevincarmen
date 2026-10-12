'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, RotateCcw } from 'lucide-react';
import type { PublicCourseDetail } from '@/lib/api/courses';
import { getResumeLessonSlug } from '@/lib/course-progress';
import { Button } from '@/components/ui/button';

/** Botón principal de la landing: continúa donde el alumno quedó. */
export function CourseCta({ course }: { course: PublicCourseDetail }) {
  const firstLesson = course.modules.find((m) => m.lessons.length > 0)?.lessons[0];

  // Se resuelve tras el montaje: leer localStorage durante la hidratación
  // provocaría que servidor y cliente pintaran textos distintos.
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    setTarget(getResumeLessonSlug(course.slug, firstLesson?.slug ?? null));
  }, [course.slug, firstLesson?.slug]);

  if (!target) {
    return <span className="text-sm text-muted-foreground">Sin clases publicadas aún.</span>;
  }

  const href = `/cursos/${course.slug}/${target}`;
  const isReturning = target !== firstLesson?.slug;

  if (isReturning) {
    return (
      <Button asChild variant="accent" size="lg" className="w-fit gap-2">
        <Link href={href}>
          <RotateCcw className="h-4 w-4" /> Continuar donde quedaste
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild variant="accent" size="lg" className="w-fit gap-2">
      <Link href={href}>
        <Play className="h-4 w-4" /> Comenzar curso
      </Link>
    </Button>
  );
}
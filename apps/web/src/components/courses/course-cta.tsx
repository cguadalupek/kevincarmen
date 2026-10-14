'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import type { PublicCourseDetail } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';

/** Botón principal de la landing: abre la primera clase del curso. */
export function CourseCta({ course }: { course: PublicCourseDetail }) {
  const firstLesson = course.modules.find((m) => m.lessons.length > 0)?.lessons[0];

  if (!firstLesson) {
    return <span className="text-sm text-muted-foreground">Sin clases publicadas aún.</span>;
  }

  return (
    <Button asChild variant="accent" size="lg" className="w-fit gap-2">
      <Link href={`/cursos/${course.slug}/${firstLesson.slug}`}>
        <Play className="h-4 w-4" /> Comenzar curso
      </Link>
    </Button>
  );
}

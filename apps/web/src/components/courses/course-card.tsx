'use client';

import Link from 'next/link';
import { BookOpen, Clock, GraduationCap, Layers, Signal } from 'lucide-react';
import type { PublicCourse } from '@/lib/api/courses';
import { cn } from '@/lib/utils';

const levelLabels = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
} as const;

const statusLabels = {
  COMING_SOON: 'Próximamente',
  AVAILABLE: 'Disponible',
  IN_PROGRESS: 'En producción',
  ARCHIVED: 'Archivado',
} as const;

/**
 * Tarjeta de curso del catálogo. Sin barra de progreso: los cursos son abiertos,
 * no hay seguimiento del alumno (se retiró junto con la lógica de progreso).
 */
export function CourseCard({ course }: { course: PublicCourse }) {
  return (
    <article className="glass-card flex h-full flex-col overflow-hidden hover-lift">
      <Link href={`/cursos/${course.slug}`} className="group flex h-full flex-col">
        <div className="relative m-3 mb-0 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
          {course.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={course.coverImage}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 via-card to-card">
              <GraduationCap className="h-12 w-12 text-accent/40" />
            </div>
          )}
          <span
            className={cn(
              'absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm',
              course.status === 'AVAILABLE'
                ? 'bg-accent/90 text-accent-foreground'
                : 'bg-black/70 text-accent',
            )}
          >
            {statusLabels[course.status]}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 pt-4">
          <h2 className="text-lg font-semibold transition-colors group-hover:text-accent">
            {course.title}
          </h2>
          {course.subtitle && (
            <p className="mt-1 text-[13px] font-medium text-accent/80">{course.subtitle}</p>
          )}
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
            {course.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Signal className="h-3.5 w-3.5 text-accent" />
              {levelLabels[course.level]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-accent" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-accent" />
              {course.modulesCount} módulos · {course.lessonsCount} clases
            </span>
          </div>

          <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
            Ver curso
            <BookOpen className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

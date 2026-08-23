import type { Metadata } from 'next';
import { BookOpen, Clock, GraduationCap, Signal } from 'lucide-react';
import { getPublishedCourses } from '@/lib/api/posts';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Cursos',
  description: 'Cursos sobre desarrollo web, infraestructura y administración de sistemas.',
  alternates: { canonical: '/cursos' },
};

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

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <div className="flex items-center gap-3 text-accent"><GraduationCap className="h-6 w-6" /><span className="font-mono text-sm">/ formación</span></div>
          <h1 className="section-title mt-3">Cursos</h1>
          <p className="section-subtitle">
            Formación estructurada en desarrollo, infraestructura y DevOps. Pagos próximamente.
          </p>
        </FadeIn>

        {courses.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Aún no hay cursos publicados.
          </div>
        ) : (
          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <StaggerItem key={course.id}>
                <article className="glass-card flex h-full flex-col p-6 hover-lift">
                  <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {course.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <span className="mb-2 w-fit rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {statusLabels[course.status]}
                  </span>
                  <h2 className="text-lg font-semibold">{course.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{course.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Signal className="h-3.5 w-3.5" />
                      {levelLabels[course.level]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration}
                    </span>
                    <span className={cn('font-mono')}>{course.lessonsCount} lecciones</span>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
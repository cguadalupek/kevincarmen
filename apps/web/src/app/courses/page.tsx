import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { getPublishedCourses } from '@/lib/api/courses';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { CourseCard } from '@/components/courses/course-card';

export const metadata: Metadata = {
  title: 'Cursos',
  description:
    'Cursos estructurados en módulos y clases con progreso: desarrollo, infraestructura y administración de sistemas.',
  alternates: { canonical: '/cursos' },
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <div className="flex items-center gap-3 text-accent">
            <GraduationCap className="h-6 w-6" />
            <span className="font-mono text-sm">/ formación</span>
          </div>
          <h1 className="section-title mt-3">Cursos</h1>
          <p className="section-subtitle">
            Formación estructurada en módulos y clases, con tu progreso guardado. Entra a un
            curso y continúa donde lo dejaste.
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
                <CourseCard course={course} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
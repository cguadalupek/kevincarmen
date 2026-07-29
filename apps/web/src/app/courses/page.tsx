import type { Metadata } from 'next';
import { BookOpen, Clock, Signal } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Cursos',
  description: 'Cursos sobre desarrollo web, infraestructura y administración de sistemas.',
};

const courses = [
  {
    id: '1',
    title: 'Docker desde Cero',
    description: 'Aprende contenedores, Docker Compose y despliegue de aplicaciones.',
    level: 'beginner' as const,
    duration: '8 horas',
    lessonsCount: 24,
    status: 'coming-soon' as const,
  },
  {
    id: '2',
    title: 'Administración de Servidores Linux',
    description: 'Gestión de servidores, servicios, seguridad y automatización.',
    level: 'intermediate' as const,
    duration: '12 horas',
    lessonsCount: 36,
    status: 'coming-soon' as const,
  },
  {
    id: '3',
    title: 'Next.js Full Stack',
    description: 'Desarrollo web moderno con Next.js, TypeScript y despliegue.',
    level: 'intermediate' as const,
    duration: '15 horas',
    lessonsCount: 42,
    status: 'in-progress' as const,
  },
];

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const statusLabels = {
  'coming-soon': 'Próximamente',
  available: 'Disponible',
  'in-progress': 'En producción',
};

export default function CoursesPage() {
  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Cursos</h1>
          <p className="section-subtitle">
            Formación estructurada en desarrollo, infraestructura y DevOps. Pagos próximamente.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <StaggerItem key={course.id}>
              <article className="glass-card flex h-full flex-col p-6 hover-lift">
                <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
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
      </div>
    </div>
  );
}

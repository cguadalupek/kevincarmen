import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  ListChecks,
  Play,
  ShieldCheck,
  Signal,
  Target,
  Users,
  Wrench,
} from 'lucide-react';
import { getCourseBySlug, formatMinutes } from '@/lib/api/courses';
import { CourseCta } from '@/components/courses/course-cta';
import { cn } from '@/lib/utils';

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamicParams = true;

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

const typeMeta = {
  VIDEO: { label: 'Video', icon: Play },
  ARTICLE: { label: 'Lectura', icon: FileText },
  PRACTICE: { label: 'Práctica', icon: Wrench },
  QUIZ: { label: 'Quiz', icon: CheckCircle2 },
} as const;

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: 'Curso no encontrado' };
  return {
    title: `${course.title} | Cursos`,
    description: course.subtitle ?? course.description,
    alternates: { canonical: `/cursos/${course.slug}` },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const publishedLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalMinutes = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration || 0), 0),
    0,
  );

  return (
    <div className="pb-20">
      {/* ── hero ── */}
      <section className="border-b border-border bg-card/30">
        <div className="section-container grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-20">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 font-medium',
                  course.status === 'AVAILABLE'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-accent/10 text-accent',
                )}
              >
                {statusLabels[course.status]}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                <Signal className="h-3 w-3" /> {levelLabels[course.level]}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                <Layers className="h-3 w-3" /> {course.modules.length} módulos
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                <BookOpen className="h-3 w-3" /> {publishedLessons} clases
              </span>
            </div>

            <h1 className="section-title mt-5">{course.title}</h1>
            {course.subtitle && (
              <p className="mt-3 text-lg font-medium text-accent">{course.subtitle}</p>
            )}
            <p className="mt-4 max-w-2xl text-muted-foreground">{course.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" /> {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-accent" /> {formatMinutes(totalMinutes)} de
                video y práctica
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" /> 100% práctico
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <CourseCta course={course} />
              <a
                href="#temario"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
              >
                Ver temario ↓
              </a>
            </div>

            <p className="mt-8 max-w-2xl rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Para quien va este curso:</span>{' '}
              {course.targetAudience ?? 'Cualquier persona con ganas de aprender.'}
            </p>
          </div>

          {/* portada */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/50 via-card to-card lg:mt-2">
            {course.coverImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={course.coverImage}
                alt={course.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <GraduationCap className="h-24 w-24 text-accent/25" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <div className="section-container">
        {/* ── aprenderás ── */}
        {course.learningPoints.length > 0 && (
          <section className="mt-14">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ListChecks className="h-5 w-5 text-accent" /> ¿Qué aprenderás?
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.learningPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── requisitos ── */}
        {course.requirements.length > 0 && (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Target className="h-5 w-5 text-accent" /> Requisitos
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {course.requirements.map((requirement) => (
                <li key={requirement} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {requirement}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── temario ── */}
        <section id="temario" className="mt-14 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-accent" /> Temario del curso
            </h2>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {course.modules.length} módulos · {publishedLessons}{' '}
              clases
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {course.modules.map((module, moduleIndex) => (
              <details
                key={module.id}
                open={moduleIndex === 0}
                className="group rounded-xl border border-border bg-card/40 transition-colors open:border-accent/30"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent">
                    {String(moduleIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{module.title}</span>
                    {module.description && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {module.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {module.lessons.length} clases
                  </span>
                </summary>
                <ul className="border-t border-border">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const meta = typeMeta[lesson.type];
                    const Icon = meta.icon;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/cursos/${course.slug}/${lesson.slug}`}
                          className="group/lesson flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/5"
                        >
                          <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground/60">
                            {lessonIndex + 1}
                          </span>
                          <Icon className="h-4 w-4 shrink-0 text-accent" />
                          <span className="flex-1 truncate group-hover/lesson:text-accent">
                            {lesson.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted-foreground">
                            {meta.label}
                            {lesson.duration > 0 && ` · ${lesson.duration} min`}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        </section>

        {/* ── cierre ── */}
        <section className="mt-14 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card/60 to-card p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold">Listo para empezar</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Tu progreso se guarda automáticamente en este navegador. Puedes ir y volver cuando
            quieras.
          </p>
          <div className="mt-6 flex justify-center">
            <CourseCta course={course} />
          </div>
        </section>
      </div>
    </div>
  );
}
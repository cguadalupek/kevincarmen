import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/lib/api/courses';
import { CoursePlayer } from '@/components/courses/course-player';

interface LessonPageProps {
  params: Promise<{ slug: string; lesson: string }>;
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug, lesson } = await params;
  const course = await getCourseBySlug(slug);
  const found = course?.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.slug === lesson);
  if (!course || !found) return { title: 'Clase no encontrada' };
  return {
    title: `${found.title} | ${course.title}`,
    description: found.description ?? course.subtitle ?? course.description,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lesson } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const exists = course.modules.some((m) => m.lessons.some((l) => l.slug === lesson));
  if (!exists) notFound();

  return (
    <div className="min-h-[70vh] bg-grid-pattern bg-grid">
      <CoursePlayer course={course} initialLessonSlug={lesson} />
    </div>
  );
}
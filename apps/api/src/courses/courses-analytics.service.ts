import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STUDENT_ROLE } from '../auth/roles';

/** Fila del ranking «capítulos más completados». */
export interface ChapterCompletionRow {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  chapterId: string;
  chapterTitle: string;
  chapterSlug: string;
  /** Posición de la clase dentro del curso (1 = primer capítulo). */
  chapterPosition: number;
  completions: number;
}

/** Avance agregado de un curso. */
export interface CourseProgressRow {
  courseId: string;
  title: string;
  slug: string;
  /** Clases publicadas (el denominador del porcentaje). */
  chapters: number;
  /** Alumnos registrados con al menos una clase completada en este curso. */
  students: number;
  completions: number;
  /** 0..1 — media del % completado entre los alumnos que empezaron el curso. */
  avgCompletion: number;
}

/** Tramo del histograma de avance. */
export interface DistributionBucket {
  label: string;
  students: number;
}

export interface CourseAnalytics {
  students: {
    total: number;
    last7Days: number;
    last30Days: number;
    /** Alumnos con actividad de progreso en los últimos 7 días. */
    activeLast7Days: number;
  };
  totals: {
    completions: number;
    /** Pares (curso, clase) con al menos una marca: el techo de `completions`. */
    chaptersWithProgress: number;
    courses: number;
    /** 0..1 — avance medio de todos los alumnos que empezaron algún curso. */
    avgCompletion: number;
  };
  topChapters: ChapterCompletionRow[];
  courses: CourseProgressRow[];
  distribution: DistributionBucket[];
  recent: {
    userName: string;
    userEmail: string;
    courseTitle: string;
    chapterTitle: string;
    updatedAt: Date;
  }[];
}

const DAY = 24 * 60 * 60 * 1000;

/** Alumno registrado tal como lo pinta la tabla del panel. */
export interface StudentRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  /** Clases marcadas como completadas (todos sus cursos). */
  chaptersCompleted: number;
  /** Cursos distintos en los que tiene al menos una clase. */
  coursesStarted: number;
  /** Última clase completada; `null` si nunca marcó nada. */
  lastActivityAt: Date | null;
}

export interface StudentList {
  /** Total de alumnos registrados (puede ser mayor que `items` por el tope). */
  total: number;
  items: StudentRow[];
}

/**
 * Métricas del panel para la sección Cursos.
 *
 * Todo se calcula sobre `course_progress` (usuarios registrados) y `users` con rol
 * `student`. Los invitados no entran en ninguna cifra: su progreso vive solo en su
 * navegador, así que el panel mide alumnos con cuenta, que es lo que el dueño puede
 * ver de verdad.
 *
 * Los agregados se resuelven con `groupBy` y se rematan en memoria: el catálogo es
 * de decenas de clases, y así el panel no depende de SQL crudo (que devuelve
 * `bigint` como string) ni de relaciones que `Like` no tiene.
 */
@Injectable()
export class CoursesAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(): Promise<CourseAnalytics> {
    const now = Date.now();
    const since7 = new Date(now - 7 * DAY);
    const since30 = new Date(now - 30 * DAY);

    const [
      studentTotal,
      studentLast7,
      studentLast30,
      courses,
      lessons,
      grouped,
      perUserCourse,
      activeUsers,
      recentRows,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { name: STUDENT_ROLE } } }),
      this.prisma.user.count({
        where: { role: { name: STUDENT_ROLE }, createdAt: { gte: since7 } },
      }),
      this.prisma.user.count({
        where: { role: { name: STUDENT_ROLE }, createdAt: { gte: since30 } },
      }),
      this.prisma.course.findMany({
        select: { id: true, title: true, slug: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.lesson.findMany({
        where: { published: true },
        select: {
          id: true,
          title: true,
          slug: true,
          position: true,
          module: { select: { courseId: true } },
        },
      }),
      this.prisma.courseProgress.groupBy({
        by: ['courseId', 'chapterId'],
        where: { completed: true },
        _count: { _all: true },
      }),
      this.prisma.courseProgress.groupBy({
        by: ['courseId', 'userId'],
        where: { completed: true },
        _count: { _all: true },
      }),
      this.prisma.courseProgress.groupBy({
        by: ['userId'],
        where: { updatedAt: { gte: since7 } },
        _count: { _all: true },
      }),
      this.prisma.courseProgress.findMany({
        where: { completed: true },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
          updatedAt: true,
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
          chapter: { select: { title: true } },
        },
      }),
    ]);

    // Índices en memoria: título/slug de curso y de clase.
    const courseById = new Map(courses.map((course) => [course.id, course]));
    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    const chaptersByCourse = new Map<string, number>();
    for (const lesson of lessons) {
      const courseId = lesson.module.courseId;
      chaptersByCourse.set(courseId, (chaptersByCourse.get(courseId) ?? 0) + 1);
    }

    const topChapters: ChapterCompletionRow[] = grouped
      .map((row) => {
        const course = courseById.get(row.courseId);
        const lesson = lessonById.get(row.chapterId);
        return {
          courseId: row.courseId,
          courseTitle: course?.title ?? 'Curso eliminado',
          courseSlug: course?.slug ?? '',
          chapterId: row.chapterId,
          chapterTitle: lesson?.title ?? 'Clase eliminada',
          chapterSlug: lesson?.slug ?? '',
          chapterPosition: (lesson?.position ?? 0) + 1,
          completions: row._count._all,
        };
      })
      .sort((a, b) => b.completions - a.completions || a.chapterPosition - b.chapterPosition)
      .slice(0, 20);

    // Avance por curso: alumnos distintos y media de % completado.
    const byCourse = new Map<string, { students: number; completions: number; ratios: number[] }>();
    for (const row of perUserCourse) {
      const chapters = chaptersByCourse.get(row.courseId) ?? 0;
      const entry = byCourse.get(row.courseId) ?? { students: 0, completions: 0, ratios: [] };
      entry.students += 1;
      entry.completions += row._count._all;
      entry.ratios.push(chapters > 0 ? Math.min(1, row._count._all / chapters) : 0);
      byCourse.set(row.courseId, entry);
    }

    const courseRows: CourseProgressRow[] = courses
      .map((course) => {
        const entry = byCourse.get(course.id);
        const ratios = entry?.ratios ?? [];
        return {
          courseId: course.id,
          title: course.title,
          slug: course.slug,
          chapters: chaptersByCourse.get(course.id) ?? 0,
          students: entry?.students ?? 0,
          completions: entry?.completions ?? 0,
          avgCompletion: ratios.length
            ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
            : 0,
        };
      })
      .sort((a, b) => b.completions - a.completions);

    // Histograma de avance sobre TODOS los pares (alumno, curso).
    const distribution: DistributionBucket[] = [
      { label: '1–25 %', students: 0 },
      { label: '26–50 %', students: 0 },
      { label: '51–75 %', students: 0 },
      { label: '76–99 %', students: 0 },
      { label: '100 %', students: 0 },
    ];
    let ratioSum = 0;
    let ratioCount = 0;
    for (const entry of byCourse.values()) {
      for (const ratio of entry.ratios) {
        ratioSum += ratio;
        ratioCount += 1;
        if (ratio >= 1) distribution[4].students += 1;
        else if (ratio > 0.75) distribution[3].students += 1;
        else if (ratio > 0.5) distribution[2].students += 1;
        else if (ratio > 0.25) distribution[1].students += 1;
        else distribution[0].students += 1;
      }
    }

    return {
      students: {
        total: studentTotal,
        last7Days: studentLast7,
        last30Days: studentLast30,
        activeLast7Days: activeUsers.length,
      },
      totals: {
        completions: grouped.reduce((sum, row) => sum + row._count._all, 0),
        chaptersWithProgress: grouped.length,
        courses: courses.length,
        avgCompletion: ratioCount > 0 ? ratioSum / ratioCount : 0,
      },
      topChapters,
      courses: courseRows,
      distribution,
      recent: recentRows.map((row) => ({
        userName: row.user.name,
        userEmail: row.user.email,
        courseTitle: row.course.title,
        chapterTitle: row.chapter.title,
        updatedAt: row.updatedAt,
      })),
    };
  }

  /**
   * `GET /courses/admin/students` — listado de alumnos registrados con correo y
   * fecha de alta, más su actividad (clases completadas, cursos empezados y última
   * marca). Es la vista de «quién está aprendiendo», no un agregado.
   *
   * El tope de 500 evita una respuesta gigante si algún día crece el catálogo de
   * cuentas; `total` va aparte para que el panel pueda avisar de que hay más.
   * Nunca se selecciona `passwordHash`.
   */
  async listStudents(): Promise<StudentList> {
    const [total, students] = await Promise.all([
      this.prisma.user.count({ where: { role: { name: STUDENT_ROLE } } }),
      this.prisma.user.findMany({
        where: { role: { name: STUDENT_ROLE } },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          courseProgress: {
            where: { completed: true },
            select: { courseId: true, updatedAt: true },
          },
        },
      }),
    ]);

    return {
      total,
      items: students.map((student) => {
        const courses = new Set(student.courseProgress.map((row) => row.courseId));
        const lastActivityAt = student.courseProgress.reduce<Date | null>(
          (latest, row) => (!latest || row.updatedAt > latest ? row.updatedAt : latest),
          null,
        );
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          createdAt: student.createdAt,
          chaptersCompleted: student.courseProgress.length,
          coursesStarted: courses.size,
          lastActivityAt,
        };
      }),
    };
  }
}

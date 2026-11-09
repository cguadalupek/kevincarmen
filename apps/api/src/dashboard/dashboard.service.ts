import { Injectable } from '@nestjs/common';
import { CourseStatus, PostStatus, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { STUDENT_ROLE } from '../auth/roles';

/** Contenido de cada sección del panel, con su desglose útil. */
export interface DashboardContent {
  posts: { total: number; published: number; drafts: number; scheduled: number };
  projects: { total: number; active: number; archived: number };
  videos: { total: number; shorts: number; featured: number };
  courses: { total: number; active: number; lessons: number };
  lab: { total: number; published: number };
  resources: { total: number; published: number };
  timeline: { total: number };
}

/** Señales de uso del sitio que el panel puede medir de verdad. */
export interface DashboardEngagement {
  likes: { total: number; today: number; last7Days: number; last30Days: number };
  downloads: number;
  subscribers: { active: number; total: number };
  students: { total: number; activeLast7Days: number };
  completions: number;
}

/** Un día del gráfico de actividad (últimos 14, hora de Chile). */
export interface DashboardActivityDay {
  /** `YYYY-MM-DD` en hora de Chile. */
  date: string;
  likes: number;
  completions: number;
  subscribers: number;
}

export type DashboardRecentType =
  'Artículo' | 'Proyecto' | 'Experimento' | 'Curso' | 'Video' | 'Recurso';

/** Último cambio de contenido, para la lista «Actividad reciente». */
export interface DashboardRecent {
  type: DashboardRecentType;
  title: string;
  updatedAt: string;
  href: string;
}

export interface DashboardSummary {
  content: DashboardContent;
  engagement: DashboardEngagement;
  activity: DashboardActivityDay[];
  recent: DashboardRecent[];
}

const ACTIVITY_DAYS = 14;
const RECENT_LIMIT = 8;
const DAY = 24 * 60 * 60 * 1000;

/**
 * Resumen del dashboard (`GET /dashboard/admin/summary`).
 *
 * Todo son agregados de la base de datos: totales por sección, señales de uso
 * (likes, descargas, suscriptores, alumnos, clases completadas) y una serie de
 * 14 días con la actividad diaria. Las visitas NO están aquí: el tráfico vive en
 * la instancia de Umami, que no comparte base de datos con la API.
 */
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const since7 = new Date(Date.now() - 7 * DAY);
    const since30 = new Date(Date.now() - 30 * DAY);

    const [
      postStatuses,
      projectStatuses,
      videoTotals,
      courseStatuses,
      lessons,
      labStatuses,
      resourceTotals,
      resourcePublished,
      timelineTotal,
      likeRow,
      subscriberStatuses,
      studentTotal,
      activeStudents,
      completions,
      activityRows,
      recentPosts,
      recentProjects,
      recentLab,
      recentCourses,
      recentVideos,
      recentResources,
    ] = await Promise.all([
      this.prisma.post.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.video.groupBy({ by: ['isShort', 'featured'], _count: { _all: true } }),
      this.prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.lesson.count({ where: { published: true } }),
      this.prisma.labExperiment.groupBy({ by: ['published'], _count: { _all: true } }),
      this.prisma.resource.aggregate({ _count: { _all: true }, _sum: { downloads: true } }),
      this.prisma.resource.count({ where: { published: true } }),
      this.prisma.timelineEvent.count(),
      this.likeTotals(),
      this.prisma.newsletterSubscriber.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.user.count({ where: { role: { name: STUDENT_ROLE } } }),
      this.prisma.courseProgress.groupBy({
        by: ['userId'],
        where: { updatedAt: { gte: since7 } },
      }),
      this.prisma.courseProgress.count({ where: { completed: true } }),
      this.activitySeries(),
      this.prisma.post.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.project.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.labExperiment.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.course.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.video.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.resource.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_LIMIT,
      }),
    ]);

    const posts = {
      total: postStatuses.reduce((sum, row) => sum + row._count._all, 0),
      published: this.statusCount(postStatuses, PostStatus.PUBLISHED),
      drafts: this.statusCount(postStatuses, PostStatus.DRAFT),
      scheduled: this.statusCount(postStatuses, PostStatus.SCHEDULED),
    };

    const projects = {
      total: projectStatuses.reduce((sum, row) => sum + row._count._all, 0),
      active: projectStatuses
        .filter((row) => row.status !== ProjectStatus.ARCHIVED)
        .reduce((sum, row) => sum + row._count._all, 0),
      archived: this.statusCount(projectStatuses, ProjectStatus.ARCHIVED),
    };

    const videos = {
      total: videoTotals.reduce((sum, row) => sum + row._count._all, 0),
      shorts: videoTotals
        .filter((row) => row.isShort)
        .reduce((sum, row) => sum + row._count._all, 0),
      featured: videoTotals
        .filter((row) => row.featured)
        .reduce((sum, row) => sum + row._count._all, 0),
    };

    const courses = {
      total: courseStatuses.reduce((sum, row) => sum + row._count._all, 0),
      active: courseStatuses
        .filter(
          (row) => row.status === CourseStatus.AVAILABLE || row.status === CourseStatus.IN_PROGRESS,
        )
        .reduce((sum, row) => sum + row._count._all, 0),
      lessons,
    };

    const lab = {
      total: labStatuses.reduce((sum, row) => sum + row._count._all, 0),
      published: labStatuses
        .filter((row) => row.published === true)
        .reduce((sum, row) => sum + row._count._all, 0),
    };

    const resources = {
      total: resourceTotals._count._all,
      published: resourcePublished,
    };

    const subscribers = {
      total: subscriberStatuses.reduce((sum, row) => sum + row._count._all, 0),
      active: subscriberStatuses
        .filter((row) => row.status === 'ACTIVE')
        .reduce((sum, row) => sum + row._count._all, 0),
    };

    return {
      content: {
        posts,
        projects,
        videos,
        courses,
        lab,
        resources,
        timeline: { total: timelineTotal },
      },
      engagement: {
        likes: likeRow,
        downloads: resourceTotals._sum.downloads ?? 0,
        subscribers,
        students: { total: studentTotal, activeLast7Days: activeStudents.length },
        completions,
      },
      activity: activityRows,
      recent: this.mergeRecent([
        ...recentPosts.map((row) =>
          this.recentFrom('Artículo', { ...row, href: `/admin/posts/${row.id}` }),
        ),
        ...recentProjects.map((row) =>
          this.recentFrom('Proyecto', { ...row, href: '/admin/projects' }),
        ),
        ...recentLab.map((row) =>
          this.recentFrom('Experimento', { ...row, href: `/admin/lab/${row.id}` }),
        ),
        ...recentCourses.map((row) =>
          this.recentFrom('Curso', { ...row, href: `/admin/courses/${row.id}` }),
        ),
        ...recentVideos.map((row) => this.recentFrom('Video', { ...row, href: '/admin/videos' })),
        ...recentResources.map((row) =>
          this.recentFrom('Recurso', { ...row, href: '/admin/recursos' }),
        ),
      ]),
    };
  }

  /** Totales de likes en UNA consulta (mismo criterio de zona que `LikesService`). */
  private async likeTotals(): Promise<DashboardEngagement['likes']> {
    const [row] = await this.prisma.$queryRaw<
      { total: number; today: number; last7Days: number; last30Days: number }[]
    >`
      SELECT
        count(*)::int AS "total",
        (count(*) FILTER (
          WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'America/Santiago')
                              AT TIME ZONE 'America/Santiago'
        ))::int AS "today",
        (count(*) FILTER (WHERE created_at >= now() - interval '7 days'))::int  AS "last7Days",
        (count(*) FILTER (WHERE created_at >= now() - interval '30 days'))::int AS "last30Days"
      FROM likes
    `;

    return {
      total: row?.total ?? 0,
      today: row?.today ?? 0,
      last7Days: row?.last7Days ?? 0,
      last30Days: row?.last30Days ?? 0,
    };
  }

  /**
   * Serie diaria de los últimos 14 días (hora de Chile).
   *
   * `generate_series` rellena los días SIN actividad con ceros: una serie con
   * huecos pintaría un gráfico engañoso. Las tres señales salen de tablas
   * distintas, así que van como subconsultas agregadas y se unen por fecha.
   */
  private activitySeries(): Promise<DashboardActivityDay[]> {
    return this.prisma.$queryRaw<DashboardActivityDay[]>`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', now() AT TIME ZONE 'America/Santiago') - interval '13 days',
          date_trunc('day', now() AT TIME ZONE 'America/Santiago'),
          interval '1 day'
        ) AS day
      )
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS "date",
        COALESCE(l.total, 0)::int    AS "likes",
        COALESCE(c.total, 0)::int    AS "completions",
        COALESCE(s.total, 0)::int    AS "subscribers"
      FROM days d
      LEFT JOIN (
        SELECT date_trunc('day', created_at AT TIME ZONE 'America/Santiago') AS day,
               count(*) AS total
        FROM likes
        GROUP BY 1
      ) l ON l.day = d.day
      LEFT JOIN (
        SELECT date_trunc('day', updated_at AT TIME ZONE 'America/Santiago') AS day,
               count(*) AS total
        FROM course_progress
        WHERE completed = true
        GROUP BY 1
      ) c ON c.day = d.day
      LEFT JOIN (
        SELECT date_trunc('day', created_at AT TIME ZONE 'America/Santiago') AS day,
               count(*) AS total
        FROM newsletter_subscribers
        GROUP BY 1
      ) s ON s.day = d.day
      ORDER BY d.day
    `;
  }

  private statusCount(
    rows: { status: string; _count: { _all: number } }[],
    status: string,
  ): number {
    return rows
      .filter((row) => row.status === status)
      .reduce((sum, row) => sum + (row._count._all ?? 0), 0);
  }

  private recentFrom(
    type: DashboardRecentType,
    row: { title: string; updatedAt: Date; href: string },
  ): DashboardRecent {
    return {
      type,
      title: row.title?.trim() || 'Sin título',
      updatedAt: row.updatedAt.toISOString(),
      href: row.href,
    };
  }

  private mergeRecent(items: DashboardRecent[]): DashboardRecent[] {
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT);
  }
}

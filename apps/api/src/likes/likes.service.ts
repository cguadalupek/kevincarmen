import { Injectable, NotFoundException } from '@nestjs/common';
import { LikeEntity, PostStatus, Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { recordLikeTelemetry } from './likes-telemetry';

export interface LikeStatus {
  entity: LikeEntity;
  entityId: string;
  count: number;
  /** `true` si ESTE visitante ya lo marcó. Siempre `false` sin `visitorId`. */
  liked: boolean;
}

/** Totales del panel de analítica (`GET /likes/admin/analytics`). */
export interface LikeAnalytics {
  /** Likes acumulados en artículos. */
  posts: number;
  /** Likes acumulados en proyectos. */
  projects: number;
  /** Likes desde las 00:00 en hora de Chile. */
  today: number;
  last7Days: number;
  last30Days: number;
  /** Detalle por contenido con al menos un voto, ordenado por votos. */
  items: LikeAnalyticsItem[];
}

/** Una fila de la tabla del panel: el contenido y la sección de la que viene. */
export interface LikeAnalyticsItem {
  id: string;
  title: string;
  slug: string;
  type: 'POST' | 'PROJECT';
  /** Categoría principal del artículo o clasificación del proyecto. */
  section: string | null;
  /** Subcategoría del artículo (los proyectos no tienen). */
  subcategory: string | null;
  count: number;
}

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Un like solo puede apuntar a contenido que el público ve: artículos
   * publicados y proyectos no archivados. Sin esta comprobación cualquiera
   * podría inflar el contador de ids inexistentes y llenar `likes` de basura.
   */
  private async assertTargetExists(entity: LikeEntity, entityId: string): Promise<void> {
    const visible =
      entity === LikeEntity.POST
        ? await this.prisma.post.count({ where: { id: entityId, status: PostStatus.PUBLISHED } })
        : await this.prisma.project.count({
            where: { id: entityId, status: { not: ProjectStatus.ARCHIVED } },
          });

    if (visible === 0) {
      throw new NotFoundException('El contenido no existe o no está publicado.');
    }
  }

  async status(entity: LikeEntity, entityId: string, visitorId?: string): Promise<LikeStatus> {
    const where = { entity, entityId };

    const [count, mine] = await Promise.all([
      this.prisma.like.count({ where }),
      visitorId ? this.prisma.like.count({ where: { ...where, visitorId } }) : Promise.resolve(0),
    ]);

    return { entity, entityId, count, liked: mine > 0 };
  }

  /**
   * Contadores de VARIOS contenidos en una sola consulta (los listados pintan 4-6
   * tarjetas por página; una petición por tarjeta sería absurdo).
   * Los ids sin votos no aparecen en el mapa: la web los trata como 0.
   */
  async counts(entity: LikeEntity, entityIds: string[]): Promise<Record<string, number>> {
    const ids = Array.from(new Set(entityIds.filter(Boolean)));
    if (ids.length === 0) return {};

    const grouped = await this.prisma.like.groupBy({
      by: ['entityId'],
      where: { entity, entityId: { in: ids } },
      _count: { _all: true },
    });

    return Object.fromEntries(grouped.map((row) => [row.entityId, row._count._all]));
  }

  /**
   * Totales del panel de analítica.
   *
   * UNA consulta con agregados `FILTER`: cinco `count` separados serían cinco round
   * trips para leer la misma tabla. La alternativa tipada (varios `prisma.like.count`)
   * sería más legible pero hace lo mismo cinco veces.
   *
   * `today` se calcula en hora de Chile, no en UTC: el contenedor corre en UTC y a las
   * 21:00 de Santiago un like se contaría como «mañana».
   */
  async analytics(): Promise<LikeAnalytics> {
    const [row] = await this.prisma.$queryRaw<Omit<LikeAnalytics, 'items'>[]>`
      SELECT
        (count(*) FILTER (WHERE entity = 'POST'))::int    AS "posts",
        (count(*) FILTER (WHERE entity = 'PROJECT'))::int AS "projects",
        (count(*) FILTER (
          WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'America/Santiago')
                              AT TIME ZONE 'America/Santiago'
        ))::int                                           AS "today",
        (count(*) FILTER (WHERE created_at >= now() - interval '7 days'))::int  AS "last7Days",
        (count(*) FILTER (WHERE created_at >= now() - interval '30 days'))::int AS "last30Days"
      FROM likes
    `;

    return {
      posts: row?.posts ?? 0,
      projects: row?.projects ?? 0,
      today: row?.today ?? 0,
      last7Days: row?.last7Days ?? 0,
      last30Days: row?.last30Days ?? 0,
      items: await this.analyticsItems(),
    };
  }

  /**
   * Detalle por contenido, con su sección.
   *
   * `UNION ALL` de las dos taxonomías: cada CONTENIDO usa la suya (artículo →
   * `main_categories`, proyecto → `project_categories`, con el texto denormalizado
   * `projects.category` como respaldo de los antiguos). El like es polimórfico y no
   * tiene FK, así que Prisma no puede resolver este join: va en SQL, y es UNA consulta
   * para las dos entidades en lugar de dos consultas + mezcla en memoria.
   *
   * No se limita el número de filas: el panel enseña todo lo que tenga votos (en un
   * blog personal son decenas). Si un día crece, aquí va un `LIMIT` + un agregado
   * aparte para los totales por sección.
   */
  private analyticsItems(): Promise<LikeAnalyticsItem[]> {
    return this.prisma.$queryRaw<LikeAnalyticsItem[]>`
      SELECT
        p.id                        AS "id",
        p.title                     AS "title",
        p.slug                      AS "slug",
        'POST'                      AS "type",
        mc.name                     AS "section",
        sc.name                     AS "subcategory",
        (count(l.id))::int          AS "count"
      FROM likes l
      JOIN posts p              ON p.id = l.entity_id
      LEFT JOIN main_categories mc ON mc.id = p.main_category_id
      LEFT JOIN subcategories   sc ON sc.id = p.sub_category_id
      WHERE l.entity = 'POST'
      GROUP BY p.id, p.title, p.slug, mc.name, sc.name

      UNION ALL

      SELECT
        pr.id                       AS "id",
        pr.title                    AS "title",
        pr.slug                     AS "slug",
        'PROJECT'                   AS "type",
        COALESCE(pc.name, pr.category) AS "section",
        NULL                        AS "subcategory",
        (count(l.id))::int          AS "count"
      FROM likes l
      JOIN projects pr              ON pr.id = l.entity_id
      LEFT JOIN project_categories pc ON pc.id = pr.project_category_id
      WHERE l.entity = 'PROJECT'
      GROUP BY pr.id, pr.title, pr.slug, pc.name, pr.category

      ORDER BY "count" DESC, "title" ASC
    `;
  }

  /**
   * Alterna el voto del visitante y devuelve el contador ya actualizado.
   * Idempotente por visitante gracias a `@@unique([entity, entityId, visitorId])`.
   */
  async toggle(dto: ToggleLikeDto): Promise<LikeStatus> {
    await this.assertTargetExists(dto.entity, dto.entityId);

    const existing = await this.prisma.like.findUnique({
      where: {
        entity_entityId_visitorId: {
          entity: dto.entity,
          entityId: dto.entityId,
          visitorId: dto.visitorId,
        },
      },
      select: { id: true },
    });

    let liked: boolean;

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      try {
        await this.prisma.like.create({
          data: { entity: dto.entity, entityId: dto.entityId, visitorId: dto.visitorId },
        });
      } catch (error) {
        // Dos peticiones simultáneas del mismo visitante: la segunda choca con el
        // índice único. El resultado final es el mismo (un voto), así que no es error.
        if (!this.isUniqueViolation(error)) throw error;
      }
      liked = true;
    }

    const count = await this.prisma.like.count({
      where: { entity: dto.entity, entityId: dto.entityId },
    });

    // Registro remoto en segundo plano: si el nodo SSH no responde, el like ya está
    // guardado y la respuesta sale igual (la telemetría nunca puede romper esto).
    recordLikeTelemetry({
      action: liked ? 'like' : 'unlike',
      entity: dto.entity,
      entityId: dto.entityId,
      visitorId: dto.visitorId,
      total: count,
      source: 'api',
    });

    return { entity: dto.entity, entityId: dto.entityId, count, liked };
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}

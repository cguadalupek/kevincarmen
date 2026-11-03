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

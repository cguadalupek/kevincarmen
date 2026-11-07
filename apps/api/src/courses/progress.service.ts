import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveProgressDto, SyncProgressDto } from './dto/progress.dto';

/** Fila de progreso tal como la consume el frontend. */
export interface ProgressRow {
  courseId: string;
  chapterId: string;
  completed: boolean;
  updatedAt: Date;
}

/**
 * Progreso de cursos de los usuarios REGISTRADOS.
 *
 * Los invitados no llegan aquí: su avance se guarda en el `localStorage` del
 * navegador y se sube una sola vez al crear cuenta o iniciar sesión
 * (`POST /progress/sync`), que es lo que permite conservarlo entre dispositivos.
 *
 * Toda escritura valida que la clase pertenezca al curso antes de tocar la tabla:
 * sin eso, un cliente manipulado podría crear filas con un `courseId` ajeno y
 * ensuciar las métricas del panel.
 */
@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /** `GET /progress/me` — progreso del usuario del token (todos sus cursos). */
  async findMine(userId: string): Promise<ProgressRow[]> {
    const rows = await this.prisma.courseProgress.findMany({
      where: { userId },
      select: { courseId: true, chapterId: true, completed: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return rows;
  }

  /** `PUT /progress` — marca o desmarca una clase (idempotente por `@@unique`). */
  async set(userId: string, dto: SaveProgressDto): Promise<ProgressRow> {
    await this.assertChapterBelongsToCourse(dto.chapterId, dto.courseId);

    const row = await this.prisma.courseProgress.upsert({
      where: {
        userId_courseId_chapterId: {
          userId,
          courseId: dto.courseId,
          chapterId: dto.chapterId,
        },
      },
      update: { completed: dto.completed ?? true },
      create: {
        userId,
        courseId: dto.courseId,
        chapterId: dto.chapterId,
        completed: dto.completed ?? true,
      },
      select: { courseId: true, chapterId: true, completed: true, updatedAt: true },
    });
    return row;
  }

  /**
   * `POST /progress/sync` — fusión al registrarse / iniciar sesión.
   *
   * Es una UNIÓN, no un reemplazo: lo que ya está en la nube se conserva y lo que
   * venía del navegador se añade. Solo se escriben las clases marcadas como
   * completadas (`completed !== false`), y los ítems cuyo curso o clase ya no
   * existen se descartan en silencio (un curso borrado no debe romper el login).
   */
  async sync(userId: string, dto: SyncProgressDto): Promise<ProgressRow[]> {
    const items = dto.items.filter((item) => item.completed !== false);

    if (items.length > 0) {
      const valid = await this.prisma.lesson.findMany({
        where: {
          id: { in: [...new Set(items.map((item) => item.chapterId))] },
          module: { courseId: { in: [...new Set(items.map((item) => item.courseId))] } },
        },
        select: { id: true, module: { select: { courseId: true } } },
      });

      const allowed = new Set(valid.map((lesson) => `${lesson.module.courseId}:${lesson.id}`));
      const rows = items.filter((item) => allowed.has(`${item.courseId}:${item.chapterId}`));

      if (rows.length > 0) {
        await this.prisma.$transaction(
          rows.map((item) =>
            this.prisma.courseProgress.upsert({
              where: {
                userId_courseId_chapterId: {
                  userId,
                  courseId: item.courseId,
                  chapterId: item.chapterId,
                },
              },
              update: { completed: true },
              create: {
                userId,
                courseId: item.courseId,
                chapterId: item.chapterId,
                completed: true,
              },
            }),
          ),
        );
      }
    }

    return this.findMine(userId);
  }

  /** `DELETE /progress/:courseId` — reinicia el curso para ese usuario. */
  async reset(userId: string, courseId: string) {
    const { count } = await this.prisma.courseProgress.deleteMany({
      where: { userId, courseId },
    });
    return { success: true, deleted: count };
  }

  private async assertChapterBelongsToCourse(chapterId: string, courseId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: chapterId, module: { courseId } },
      select: { id: true },
    });
    if (!lesson) {
      throw new BadRequestException('La clase no pertenece a ese curso');
    }
  }
}

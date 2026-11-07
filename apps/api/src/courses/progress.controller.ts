import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ProgressService } from './progress.service';
import { SaveProgressDto, SyncProgressDto } from './dto/progress.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-auth.guard';

/**
 * Progreso de cursos del alumno registrado. Todas las rutas exigen token de
 * sesión (`SessionAuthGuard`: vale tanto una cuenta de estudiante como la del
 * dueño), y cada usuario solo puede leer y escribir SU progreso — el `userId`
 * sale siempre del token, nunca del cuerpo de la petición.
 *
 * Los invitados no usan estos endpoints: su avance vive en `localStorage` y se
 * fusiona con `POST /progress/sync` al crear cuenta o iniciar sesión.
 */
@Controller('progress')
@UseGuards(ThrottlerGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /** `GET /progress/me` — todas las clases completadas del usuario. */
  @Get('me')
  @UseGuards(SessionAuthGuard)
  mine(@CurrentUser() user: RequestUser) {
    return this.progressService.findMine(user.id);
  }

  /** `PUT /progress` — marca/desmarca una clase. Idempotente. */
  @Put()
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  save(@CurrentUser() user: RequestUser, @Body() dto: SaveProgressDto) {
    return this.progressService.set(user.id, dto);
  }

  /**
   * `POST /progress/sync` — sube el progreso local del navegador y devuelve la
   * lista fusionada (la que debe reemplazar al `localStorage`).
   */
  @Post('sync')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  sync(@CurrentUser() user: RequestUser, @Body() dto: SyncProgressDto) {
    return this.progressService.sync(user.id, dto);
  }

  /** `DELETE /progress/:courseId` — reinicia el curso para ese usuario. */
  @Delete(':courseId')
  @UseGuards(SessionAuthGuard)
  reset(@CurrentUser() user: RequestUser, @Param('courseId') courseId: string) {
    return this.progressService.reset(user.id, courseId);
  }
}

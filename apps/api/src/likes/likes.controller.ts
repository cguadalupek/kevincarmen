import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { LikeStatusQueryDto } from './dto/like-status-query.dto';
import { LikeCountsQueryDto } from './dto/like-counts-query.dto';

/**
 * Likes del sitio público. Sin `JwtAuthGuard`: cualquier visitante puede leer el
 * contador y marcar/desmarcar SU voto (identificado por la cookie `kc_vid`).
 *
 * El throttler (registrado en `AppModule`) es lo único que impide que un script
 * infle el contador a base de UUIDs inventados: 30 alternancias por minuto e IP.
 */
@Controller('likes')
@UseGuards(ThrottlerGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /** `GET /likes?entity=POST&entityId=…&visitorId=…` */
  @Get()
  status(@Query() query: LikeStatusQueryDto) {
    return this.likesService.status(query.entity, query.entityId, query.visitorId);
  }

  /**
   * `GET /likes/counts?entity=POST&ids=a,b,c` — contadores del listado.
   * Lo consume la web en bloque para pintar las tarjetas sin una llamada por cada una.
   */
  @Get('counts')
  counts(@Query() query: LikeCountsQueryDto) {
    return this.likesService
      .counts(query.entity, query.ids.split(','))
      .then((counts) => ({ entity: query.entity, counts }));
  }

  /** `POST /likes/toggle` — devuelve `{ count, liked }` ya persistidos. */
  @Post('toggle')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  toggle(@Body() dto: ToggleLikeDto) {
    return this.likesService.toggle(dto);
  }
}

import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { CoursesAnalyticsService } from './courses-analytics.service';

/**
 * Dominio de cursos: catálogo + currículum (CMS), progreso del alumno
 * (`/progress/*`) y métricas del panel.
 *
 * `ThrottlerModule` se importa SIN `forRoot` solo para que `ThrottlerGuard` tenga
 * sus providers: el progreso se escribe muchas veces seguidas y conviene un tope
 * por IP (mismo patrón que `ContactModule`).
 */
@Module({
  imports: [ThrottlerModule],
  controllers: [CoursesController, ProgressController],
  providers: [CoursesService, ProgressService, CoursesAnalyticsService],
})
export class CoursesModule {}

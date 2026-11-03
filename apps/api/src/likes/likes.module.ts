import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

/**
 * `ThrottlerModule` se importa aquí SIN `forRoot`: la configuración global vive en
 * `AppModule`, y este import solo hace visibles sus providers (`THROTTLER_OPTIONS`,
 * almacenamiento) al `ThrottlerGuard` que usa el controlador. Sin él, Nest no puede
 * instanciar el guard dentro de este módulo y la app no arranca.
 */
@Module({
  imports: [ThrottlerModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}

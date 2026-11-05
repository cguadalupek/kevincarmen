import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

/**
 * `ThrottlerModule` se importa aquí SIN `forRoot`: la configuración global vive en
 * `AppModule` y este import solo hace visibles sus providers al `ThrottlerGuard`
 * del controlador (mismo patrón que `LikesModule`).
 */
@Module({
  imports: [ThrottlerModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}

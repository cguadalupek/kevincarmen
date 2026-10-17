import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NewsletterStatus } from '@prisma/client';

/**
 * Edición de un suscriptor desde el panel.
 *
 * Es una CLASE (no un type alias) con `@IsOptional()` en cada campo: con un alias
 * la metatype sería `Object` y el `ValidationPipe` global (`forbidNonWhitelisted`)
 * vaciaría el body, dejando la edición en un no-op silencioso.
 */
export class UpdateNewsletterDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  name?: string;

  @IsOptional()
  @IsEnum(NewsletterStatus, { message: 'Estado no válido.' })
  status?: NewsletterStatus;
}

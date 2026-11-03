import { LikeEntity } from '@prisma/client';
import { IsEnum, IsString, IsUUID, Length } from 'class-validator';

/**
 * Alta/baja de un «me gusta» (endpoint público, sin autenticación).
 *
 * `visitorId` es el UUID que la web guarda en la cookie `kc_vid`: identifica al
 * visitante anónimo para poder alternar su voto sin duplicar filas. Es
 * falsificable por definición (cualquiera puede inventarse UUIDs), así que el
 * contador es una métrica de popularidad, no un sistema de votación.
 */
export class ToggleLikeDto {
  @IsEnum(LikeEntity, { message: 'Tipo de contenido no válido.' })
  entity!: LikeEntity;

  @IsString()
  @Length(1, 64, { message: 'Identificador de contenido no válido.' })
  entityId!: string;

  @IsUUID('all', { message: 'Identificador de visitante no válido.' })
  visitorId!: string;
}

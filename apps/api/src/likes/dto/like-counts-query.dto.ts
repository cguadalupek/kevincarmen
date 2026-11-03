import { LikeEntity } from '@prisma/client';
import { IsEnum, IsString, Matches, MaxLength } from 'class-validator';

/** Máximo de ids por petición: los listados paginan a 4-6 tarjetas. */
export const MAX_LIKE_IDS = 100;

/** Contadores de varios contenidos a la vez (una llamada por listado, no por tarjeta). */
export class LikeCountsQueryDto {
  @IsEnum(LikeEntity, { message: 'Tipo de contenido no válido.' })
  entity!: LikeEntity;

  /** Ids separados por coma (`a,b,c`). */
  @IsString()
  @MaxLength(MAX_LIKE_IDS * 65, { message: 'Demasiados identificadores.' })
  @Matches(/^[^,\s]+(,[^,\s]+)*$/, { message: 'Identificadores no válidos.' })
  ids!: string;
}

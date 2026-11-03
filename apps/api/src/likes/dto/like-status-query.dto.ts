import { LikeEntity } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

/** Consulta del estado de los likes de una entidad (público). */
export class LikeStatusQueryDto {
  @IsEnum(LikeEntity, { message: 'Tipo de contenido no válido.' })
  entity!: LikeEntity;

  @IsString()
  @Length(1, 64, { message: 'Identificador de contenido no válido.' })
  entityId!: string;

  /** Opcional: sin él solo se devuelve el contador, no si ya lo has marcado. */
  @IsOptional()
  @IsUUID('all', { message: 'Identificador de visitante no válido.' })
  visitorId?: string;
}

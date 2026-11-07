import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/** Marca (o desmarca) una clase como completada para el usuario del token. */
export class SaveProgressDto {
  @IsString()
  @IsNotEmpty({ message: 'Falta el curso' })
  courseId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Falta la clase' })
  chapterId!: string;

  /** Por defecto `true`: el caso normal es «marcar como completada». */
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

/** Un ítem del progreso guardado en el navegador de un invitado. */
export class ProgressItemDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsString()
  @IsNotEmpty()
  chapterId!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

/**
 * Fusión del progreso local con el de la nube al registrarse o iniciar sesión.
 * El tope (500) evita que un cliente manipulado mande un array gigante: 500 clases
 * cubren de sobra el catálogo real.
 */
export class SyncProgressDto {
  @IsArray()
  @ArrayMaxSize(500, { message: 'Demasiadas clases en una sola sincronización' })
  @ValidateNested({ each: true })
  @Type(() => ProgressItemDto)
  items!: ProgressItemDto[];
}

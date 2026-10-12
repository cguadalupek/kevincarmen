import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { LessonType, VideoType } from '@prisma/client';

/** Recursos de una clase: [{ label, url }]. */
export class LessonResourceDto {
  @IsString()
  label!: string;

  @IsString()
  url!: string;
}

/**
 * Clase del curriculum. `id` es opcional: si viene, se actualiza; si no, se crea.
 * Los ids temporales del editor ("new-...") simplemente se omiten.
 */
export class CurriculumLessonDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsString()
  videoUrl?: string | null;

  @IsOptional()
  @IsEnum(VideoType)
  videoType?: VideoType;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  resources?: LessonResourceDto[] | null;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CurriculumModuleDto {
  /** Id de módulo existente, o ausente si es nuevo. */
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CurriculumLessonDto)
  lessons?: CurriculumLessonDto[];
}

export class SaveCurriculumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumModuleDto)
  modules!: CurriculumModuleDto[];
}
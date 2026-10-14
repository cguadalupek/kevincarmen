import { LegacyResourceType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  /** @deprecated tipo legado del enum: usar `resourceTypeId`. */
  @IsOptional()
  @IsEnum(LegacyResourceType)
  type?: LegacyResourceType;

  /** Id del tipo editable (tabla `resource_types`). Vacío = sin tipo enlazado. */
  @IsOptional()
  @IsString()
  resourceTypeId?: string;

  /** URL pública del archivo subido (`/uploads/...`) o enlace externo (https://...). */
  @IsOptional()
  @IsString()
  fileUrl?: string;

  /** Nombre original del archivo, para la descarga. */
  @IsOptional()
  @IsString()
  fileName?: string;

  /** Tamaño en bytes. */
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  position?: number;
}

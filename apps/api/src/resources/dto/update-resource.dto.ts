import { LegacyResourceType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateResourceDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  /** @deprecated tipo legado del enum: usar `resourceTypeId`. */
  @IsOptional() @IsEnum(LegacyResourceType) type?: LegacyResourceType;
  /** Id del tipo editable (tabla `resource_types`). Vacío = sin tipo enlazado. */
  @IsOptional() @IsString() resourceTypeId?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsInt() fileSize?: number;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsInt() position?: number;
}

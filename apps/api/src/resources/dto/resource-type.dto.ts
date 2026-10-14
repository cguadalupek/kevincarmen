import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Iconos que puede llevar un tipo de recurso en el sitio público.
 * La web los resuelve en `RESOURCE_ICONS` (`components/lab/resource-explorer.tsx`)
 * y cae al icono genérico si la clave no existe.
 */
export const RESOURCE_ICON_KEYS = [
  'file',
  'file-code',
  'file-text',
  'container',
  'list-checks',
  'book-open',
  'database',
  'terminal',
  'package',
  'shield',
  'image',
  'video',
  'archive',
] as const;

/** Alta de un tipo de recurso (nombre único; el slug se genera del nombre). */
export class CreateResourceTypeDto {
  @IsString() @IsNotEmpty() @MaxLength(60) name!: string;
  /** Vacío = se genera del nombre. */
  @IsOptional() @IsString() @MaxLength(60) slug?: string;
  @IsOptional() @IsString() @MaxLength(240) description?: string;
  @IsOptional() @IsIn(RESOURCE_ICON_KEYS as unknown as string[]) icon?: string;
  /** Vacío = se coloca al final del listado. */
  @IsOptional() @IsInt() @Min(0) position?: number;
}

export class UpdateResourceTypeDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MaxLength(60) slug?: string;
  @IsOptional() @IsString() @MaxLength(240) description?: string;
  @IsOptional() @IsIn(RESOURCE_ICON_KEYS as unknown as string[]) icon?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

/** Reordenamiento: el índice del array define la posición (10, 20, 30…). */
export class ReorderResourceTypesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  typeIds!: string[];
}

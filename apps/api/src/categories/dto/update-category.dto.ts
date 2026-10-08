import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CATEGORY_COLOR_KEYS } from '../taxonomy';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug: solo minúsculas, números y guiones (ej: mi-categoria)',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  position?: number;

  /** Clave de la paleta. */
  @IsOptional()
  @IsIn(CATEGORY_COLOR_KEYS, {
    message: `color debe ser uno de: ${CATEGORY_COLOR_KEYS.join(', ')}`,
  })
  color?: string;
}

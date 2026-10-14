import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Alta de una clasificación de proyectos (nombre único). */
export class CreateProjectCategoryDto {
  @IsString() @IsNotEmpty() @MaxLength(60) name!: string;
  /** Vacío = se genera del nombre. */
  @IsOptional() @IsString() @MaxLength(60) slug?: string;
  @IsOptional() @IsString() @MaxLength(240) description?: string;
  /** Vacío = se coloca al final del listado. */
  @IsOptional() @IsInt() @Min(0) position?: number;
}

export class UpdateProjectCategoryDto {
  @IsOptional() @IsString() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MaxLength(60) slug?: string;
  @IsOptional() @IsString() @MaxLength(240) description?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

/** Reordenamiento: el índice del array define la posición (10, 20, 30…). */
export class ReorderProjectCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categoryIds!: string[];
}

/** Reordenamiento de los proyectos publicados tal como se ven en el sitio. */
export class ReorderProjectsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  projectIds!: string[];
}

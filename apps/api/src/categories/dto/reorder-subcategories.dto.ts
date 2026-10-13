import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderSubcategoriesDto {
  /** Categoría principal a la que pertenecen las subcategorías reordenadas. */
  @IsString()
  mainCategoryId!: string;

  /** Ids de las subcategorías en el orden deseado (el índice define la posición). */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subcategoryIds!: string[];
}

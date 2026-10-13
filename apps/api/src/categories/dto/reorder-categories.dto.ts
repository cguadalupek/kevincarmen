import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderCategoriesDto {
  /** Ids de las categorías principales en el orden deseado (el índice define la posición). */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categoryIds!: string[];
}

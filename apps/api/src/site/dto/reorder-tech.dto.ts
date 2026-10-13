import { IsArray, IsOptional, IsString } from 'class-validator';

export class ReorderTechDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}
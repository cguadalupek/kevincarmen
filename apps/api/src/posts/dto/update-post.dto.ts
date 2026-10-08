import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MainCategory, PostStatus, VideoType } from '@prisma/client';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  coverImage?: string | null;

  @IsOptional()
  @IsEnum(MainCategory, {
    message: 'mainCategory debe ser SOFTWARE_DEV, INFRA_HOMELAB, IT_HARDWARE o IA_TECH',
  })
  mainCategory?: MainCategory;

  /**
   * `null` explícito desasigna la subcategoría; `undefined` la deja como está.
   * Esa distinción es la que permite quitar una subcategoría sin obligar a
   * cambiar la categoría principal.
   */
  @IsOptional()
  @IsString()
  subCategoryId?: string | null;

  /** @deprecated Taxonomía plana anterior. Se acepta pero ya no se usa. */
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsEnum(VideoType)
  videoType?: VideoType;

  @IsOptional()
  @IsString()
  externalLinkLabel?: string;

  @IsOptional()
  @IsString()
  externalLinkUrl?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

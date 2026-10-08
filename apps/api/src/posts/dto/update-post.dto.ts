import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PostStatus, VideoType } from '@prisma/client';

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
  @IsString()
  mainCategoryId?: string;

  /**
   * `null` explícito desasigna la subcategoría; `undefined` la deja como está.
   * Esa distinción permite quitar una subcategoría sin cambiar la principal.
   */
  @IsOptional()
  @IsString()
  subCategoryId?: string | null;

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

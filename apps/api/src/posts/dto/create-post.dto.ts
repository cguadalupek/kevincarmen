import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PostStatus, VideoType } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  slug!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  coverImage?: string;

  /** Id de la categoría principal. Obligatorio; se valida en el service. */
  @IsString({ message: 'mainCategoryId es obligatorio' })
  mainCategoryId!: string;

  /** Opcional. Debe pertenecer a mainCategoryId (lo verifica el service y un trigger). */
  @IsOptional()
  @IsString()
  subCategoryId?: string;

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

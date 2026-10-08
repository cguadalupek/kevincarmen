import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MainCategory, PostStatus, VideoType } from '@prisma/client';

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

  /**
   * Categoría principal: obligatoria en creación. Es lo único que garantiza que
   * ningún artículo nuevo quede fuera de la taxonomía.
   */
  @IsEnum(MainCategory, {
    message: 'mainCategory debe ser SOFTWARE_DEV, INFRA_HOMELAB, IT_HARDWARE o IA_TECH',
  })
  mainCategory!: MainCategory;

  /** Opcional. Si se envía, el service (y la FK compuesta) verifican la pertenencia. */
  @IsOptional()
  @IsString()
  subCategoryId?: string;

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

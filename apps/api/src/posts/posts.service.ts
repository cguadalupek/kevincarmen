import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PostStatus, VideoType, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { normalizeCategorySlug } from '../categories/taxonomy';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

export interface FindPublishedOptions {
  /** Slug de la categoría principal (nuevo) o slug de la taxonomía antigua. */
  categorySlug?: string;
  /** Slug de la subcategoría. */
  subCategorySlug?: string;
}

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private categories: CategoriesService,
  ) {}

  private normalizeStoredUrl(value?: string | null) {
    if (!value) return value;

    try {
      const url = new URL(value);
      const configuredHosts = new Set(
        (process.env.PUBLIC_SITE_HOSTS ?? '')
          .split(',')
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean),
      );
      const isPrivateHost =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname);

      if (isPrivateHost || configuredHosts.has(url.hostname.toLowerCase())) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // Relative paths are already in the desired format.
    }

    return value;
  }

  private normalizeStoredContent(content: string) {
    return content.replace(/https?:\/\/[^\s"'<>]+/g, (value) => {
      const normalized = this.normalizeStoredUrl(value);
      return normalized ?? value;
    });
  }

  private detectVideoType(url: string): VideoType | null {
    try {
      const { hostname, pathname } = new URL(url);
      if (/youtube\.com\/shorts\/|youtube\.com\/embed\/.*shorts/.test(url)) {
        return VideoType.YOUTUBE_SHORT;
      }
      if (/youtube\.com|youtu\.be/.test(hostname)) return VideoType.YOUTUBE;
      if (/tiktok\.com/.test(hostname)) return VideoType.TIKTOK;
      if (/twitter\.com|x\.com/.test(hostname)) return VideoType.TWITTER;
      if (/vimeo\.com/.test(hostname)) return VideoType.VIMEO;
      if (/\.(mp4|webm|ogg)$/i.test(pathname)) return VideoType.GENERIC;
    } catch {
      // ignore
    }
    return null;
  }

  private postInclude = {
    author: { select: { id: true, name: true, avatar: true, bio: true } },
    mainCategory: true,
    subCategory: true,
    tags: { include: { tag: true } },
  };

  private async assertMainExists(mainCategoryId: string) {
    const main = await this.prisma.mainCategory.findUnique({
      where: { id: mainCategoryId },
      select: { id: true },
    });
    if (!main) {
      throw new BadRequestException('La categoría principal indicada no existe');
    }
  }

  private async assertSubCategoryBelongs(subCategoryId: string, mainCategoryId: string) {
    const match = await this.categories.findMatching(subCategoryId, mainCategoryId);
    if (!match) {
      throw new BadRequestException(
        'La subcategoría seleccionada no pertenece a la categoría principal.',
      );
    }
    return match;
  }

  async findAllPublished(options: FindPublishedOptions = {}) {
    // Resuelve el filtro de categoría (acepta slug nuevo o antiguo) a un id.
    // Un valor desconocido devuelve lista vacía, no "todos".
    let mainCategoryId: string | undefined;
    if (options.categorySlug) {
      const slug = normalizeCategorySlug(options.categorySlug);
      if (!slug) return [];
      mainCategoryId = (await this.categories.findMainIdBySlug(slug)) ?? undefined;
      if (!mainCategoryId) return [];
    }

    return this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        ...(mainCategoryId ? { mainCategoryId } : {}),
        ...(options.subCategorySlug ? { subCategory: { slug: options.subCategorySlug } } : {}),
      },
      include: this.postInclude,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.post.findMany({
      include: this.postInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.post.findUnique({
      where: { slug },
      include: this.postInclude,
    });
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.postInclude,
    });
    if (!post) throw new NotFoundException('Artículo no encontrado');
    return post;
  }

  async findLatestVideos(limit = 6) {
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED', videoUrl: { not: null } },
      include: this.postInclude,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    return posts.filter((post) => Boolean(post.videoUrl));
  }

  async create(dto: CreatePostDto, authorId: string) {
    const existing = await this.prisma.post.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('El slug ya existe');

    await this.assertMainExists(dto.mainCategoryId);
    const subCategoryId = dto.subCategoryId
      ? (await this.assertSubCategoryBelongs(dto.subCategoryId, dto.mainCategoryId)).id
      : null;

    const status = dto.status ?? PostStatus.DRAFT;
    const content = this.normalizeStoredContent(dto.content);
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    const videoUrl = this.normalizeStoredUrl(dto.videoUrl) ?? null;
    const detectedVideoType = dto.videoUrl ? this.detectVideoType(dto.videoUrl) : null;
    const videoType = dto.videoType ?? detectedVideoType ?? null;

    const data: Prisma.PostUncheckedCreateInput = {
      title: dto.title,
      slug: dto.slug,
      excerpt: dto.excerpt,
      content,
      coverImage: this.normalizeStoredUrl(dto.coverImage) || null,
      videoUrl,
      videoType,
      externalLinkLabel: dto.externalLinkLabel?.trim() ? dto.externalLinkLabel : null,
      externalLinkUrl: dto.externalLinkUrl?.trim()
        ? this.normalizeStoredUrl(dto.externalLinkUrl)
        : null,
      status,
      featured: dto.featured ?? false,
      readingTime,
      authorId,
      mainCategoryId: dto.mainCategoryId,
      subCategoryId,
      publishedAt: dto.publishedAt
        ? new Date(dto.publishedAt)
        : status === PostStatus.PUBLISHED
          ? new Date()
          : null,
    };

    return this.prisma.post.create({
      data,
      include: this.postInclude,
    });
  }

  async update(id: string, dto: UpdatePostDto, userId: string) {
    const post = await this.findById(id);
    if (post.authorId !== userId) throw new ForbiddenException('Sin permisos');

    if (dto.slug && dto.slug !== post.slug) {
      const existing = await this.prisma.post.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('El slug ya existe');
    }

    const mainCategoryId = dto.mainCategoryId ?? post.mainCategoryId;
    if (dto.mainCategoryId) await this.assertMainExists(dto.mainCategoryId);

    // `undefined` = no tocar; `null` = quitar; string = asignar (validada).
    let subCategoryId: string | null | undefined;
    if (dto.subCategoryId === null) {
      subCategoryId = null;
    } else if (dto.subCategoryId) {
      subCategoryId = (await this.assertSubCategoryBelongs(dto.subCategoryId, mainCategoryId)).id;
    } else if (
      dto.mainCategoryId &&
      dto.mainCategoryId !== post.mainCategoryId &&
      post.subCategoryId
    ) {
      // Cambió la principal sin tocar la subcategoría: si la anterior ya no
      // pertenece, se avisa en vez de borrarla en silencio.
      const stillValid = await this.categories.findMatching(post.subCategoryId, dto.mainCategoryId);
      if (!stillValid) {
        throw new BadRequestException(
          'La subcategoría actual no pertenece a la nueva categoría principal. ' +
            'Envía subCategoryId: null para quitarla o elige una subcategoría de la nueva categoría.',
        );
      }
      subCategoryId = post.subCategoryId;
    }

    const content = this.normalizeStoredContent(dto.content ?? post.content);
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    const data: Prisma.PostUncheckedUpdateInput = {
      ...dto,
      mainCategoryId,
      subCategoryId,
      content,
      ...(dto.coverImage !== undefined
        ? { coverImage: this.normalizeStoredUrl(dto.coverImage) || null }
        : {}),
      ...(dto.videoUrl !== undefined
        ? { videoUrl: this.normalizeStoredUrl(dto.videoUrl) || null }
        : {}),
      ...(dto.videoType !== undefined
        ? { videoType: dto.videoType }
        : dto.videoUrl !== undefined
          ? { videoType: this.detectVideoType(dto.videoUrl) ?? null }
          : {}),
      ...(dto.externalLinkLabel !== undefined
        ? { externalLinkLabel: dto.externalLinkLabel || null }
        : {}),
      ...(dto.externalLinkUrl !== undefined
        ? { externalLinkUrl: this.normalizeStoredUrl(dto.externalLinkUrl) || null }
        : {}),
      readingTime,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
    };

    return this.prisma.post.update({
      where: { id },
      data,
      include: this.postInclude,
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.findById(id);
    if (post.authorId !== userId) throw new ForbiddenException('Sin permisos');
    await this.prisma.post.delete({ where: { id } });
    return { success: true };
  }
}

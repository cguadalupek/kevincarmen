import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PostStatus, VideoType, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

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
    category: true,
    tags: { include: { tag: true } },
  };

  async findAllPublished(options: { categorySlug?: string } = {}) {
    return this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        ...(options.categorySlug
          ? { category: { slug: options.categorySlug } }
          : {}),
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

  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreatePostDto, authorId: string) {
    const existing = await this.prisma.post.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('El slug ya existe');

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
      readingTime,
      authorId,
      categoryId: dto.categoryId || null,
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

    const content = this.normalizeStoredContent(dto.content ?? post.content);
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    const data: Prisma.PostUpdateInput = {
      ...dto,
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

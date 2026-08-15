import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PostStatus } from '@prisma/client';
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

  private postInclude = {
    author: { select: { id: true, name: true, avatar: true, bio: true } },
    category: true,
    tags: { include: { tag: true } },
  };

  async findAllPublished() {
    return this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
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

  async create(dto: CreatePostDto, authorId: string) {
    const existing = await this.prisma.post.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('El slug ya existe');

    const status = dto.status ?? PostStatus.DRAFT;
    const content = this.normalizeStoredContent(dto.content);
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content,
        coverImage: this.normalizeStoredUrl(dto.coverImage),
        status,
        readingTime,
        authorId,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
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
    const status = dto.status ?? post.status;

    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        content,
        ...(dto.coverImage !== undefined
          ? { coverImage: this.normalizeStoredUrl(dto.coverImage) }
          : {}),
        readingTime,
        publishedAt:
          status === PostStatus.PUBLISHED && !post.publishedAt ? new Date() : post.publishedAt,
      },
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

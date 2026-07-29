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
    const readingTime = Math.max(1, Math.ceil(dto.content.split(/\s+/).length / 200));

    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
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

    const content = dto.content ?? post.content;
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    const status = dto.status ?? post.status;

    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
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

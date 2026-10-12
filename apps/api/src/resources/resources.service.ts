import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

function slugify(input: string) {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  /** Solo recursos publicados, destacados primero y luego por posición. */
  async findPublished() {
    return this.prisma.resource.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAllAdmin() {
    return this.prisma.resource.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] });
  }

  async findBySlug(slug: string) {
    const resource = await this.prisma.resource.findUnique({ where: { slug } });
    if (!resource || !resource.published) throw new NotFoundException('Recurso no encontrado');
    return resource;
  }

  async findById(id: string) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException('Recurso no encontrado');
    return resource;
  }

  async create(dto: CreateResourceDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.resource.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('El slug ya existe');

    return this.prisma.resource.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        type: dto.type ?? 'OTHER',
        fileUrl: dto.fileUrl?.trim() || null,
        fileName: dto.fileName?.trim() || null,
        fileSize: dto.fileSize ?? null,
        version: dto.version?.trim() || null,
        tags: dto.tags ?? [],
        published: dto.published ?? true,
        featured: dto.featured ?? false,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateResourceDto) {
    await this.findById(id);
    const data: Prisma.ResourceUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined && dto.slug.trim()) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl?.trim() || null;
    if (dto.fileName !== undefined) data.fileName = dto.fileName?.trim() || null;
    if (dto.fileSize !== undefined) data.fileSize = dto.fileSize ?? null;
    if (dto.version !== undefined) data.version = dto.version?.trim() || null;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.published !== undefined) data.published = dto.published;
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.position !== undefined) data.position = dto.position;
    return this.prisma.resource.update({ where: { id }, data });
  }

  /** Endpoint público de descarga: incrementa el contador. */
  async registerDownload(slug: string) {
    const resource = await this.findBySlug(slug);
    await this.prisma.resource.update({
      where: { id: resource.id },
      data: { downloads: { increment: 1 } },
    });
    return { url: resource.fileUrl, fileName: resource.fileName, type: resource.type };
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.resource.delete({ where: { id } });
    return { success: true };
  }
}

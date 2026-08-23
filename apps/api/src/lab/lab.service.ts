import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

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
export class LabService {
  constructor(private prisma: PrismaService) {}

  async findAllAdmin() {
    return this.prisma.labExperiment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findPublished() {
    return this.prisma.labExperiment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const item = await this.prisma.labExperiment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Experimento no encontrado');
    return item;
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.labExperiment.findUnique({ where: { slug } });
    if (!item) throw new NotFoundException('Experimento no encontrado');
    return item;
  }

  async create(dto: CreateLabDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.labExperiment.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('El slug ya existe');
    return this.prisma.labExperiment.create({
      data: {
        title: dto.title,
        // Compatibilidad con la columna legacy que sigue siendo NOT NULL
        // en instalaciones que aún no han compactado lab_services.
        name: dto.title,
        slug,
        description: dto.description,
        objective: dto.objective,
        hypothesis: dto.hypothesis,
        environment: dto.environment,
        procedure: dto.procedure,
        status: dto.status,
        result: dto.result,
        conclusion: dto.conclusion,
        stack: dto.stack ?? [],
        tags: dto.tags ?? [],
        coverImage: dto.coverImage || null,
        gallery: dto.gallery ?? [],
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        relatedPostId: dto.relatedPostId || null,
        relatedProjectId: dto.relatedProjectId || null,
      },
    });
  }

  async update(id: string, dto: UpdateLabDto) {
    await this.findById(id);
    const data: Prisma.LabExperimentUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      // Mantener sincronizado el campo legacy mientras exista en la tabla.
      data.name = dto.title;
    }
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.objective !== undefined) data.objective = dto.objective || null;
    if (dto.hypothesis !== undefined) data.hypothesis = dto.hypothesis || null;
    if (dto.environment !== undefined) data.environment = dto.environment || null;
    if (dto.procedure !== undefined) data.procedure = dto.procedure || null;
    if (dto.result !== undefined) data.result = dto.result || null;
    if (dto.conclusion !== undefined) data.conclusion = dto.conclusion || null;
    if (dto.stack !== undefined) data.stack = dto.stack;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage || null;
    if (dto.gallery !== undefined) data.gallery = dto.gallery;
    if (dto.startedAt !== undefined) data.startedAt = dto.startedAt ? new Date(dto.startedAt) : null;
    if (dto.completedAt !== undefined) data.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    if (dto.relatedPostId !== undefined) data.relatedPostId = dto.relatedPostId || null;
    if (dto.relatedProjectId !== undefined) data.relatedProjectId = dto.relatedProjectId || null;
    return this.prisma.labExperiment.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.labExperiment.delete({ where: { id } });
    return { success: true };
  }
}

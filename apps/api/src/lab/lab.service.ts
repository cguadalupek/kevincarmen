import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabServiceDto } from './dto/create-lab-service.dto';
import { UpdateLabServiceDto } from './dto/update-lab-service.dto';

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
    return this.prisma.labService.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] });
  }

  async findPublished() {
    return this.prisma.labService.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] });
  }

  async findById(id: string) {
    const item = await this.prisma.labService.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Servicio de lab no encontrado');
    return item;
  }

  async create(dto: CreateLabServiceDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.name);
    const existing = await this.prisma.labService.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('El slug ya existe');
    return this.prisma.labService.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        stack: dto.stack ?? [],
        icon: dto.icon || null,
        status: dto.status,
        url: dto.url || null,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateLabServiceDto) {
    await this.findById(id);
    const data: Prisma.LabServiceUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.stack !== undefined) data.stack = dto.stack;
    if (dto.icon !== undefined) data.icon = dto.icon || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.url !== undefined) data.url = dto.url || null;
    if (dto.position !== undefined) data.position = dto.position;
    return this.prisma.labService.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.labService.delete({ where: { id } });
    return { success: true };
  }
}
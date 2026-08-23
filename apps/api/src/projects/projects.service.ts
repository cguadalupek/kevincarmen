import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

function slugify(input: string) { return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-'); }

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}
  findAllAdmin() { return this.prisma.project.findMany({ orderBy: { updatedAt: 'desc' } }); }
  findPublished() { return this.prisma.project.findMany({ where: { status: { not: 'ARCHIVED' } }, orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }] }); }
  async findBySlug(slug: string) { const project = await this.prisma.project.findUnique({ where: { slug } }); if (!project) throw new NotFoundException('Proyecto no encontrado'); return project; }
  async create(dto: CreateProjectDto) { const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title); if (await this.prisma.project.findUnique({ where: { slug } })) throw new ConflictException('El slug ya existe'); return this.prisma.project.create({ data: { title: dto.title, slug, description: dto.description, longDescription: dto.longDescription, technologies: dto.technologies ?? [], repository: dto.repository || null, demo: dto.demo || null, status: dto.status, featured: dto.featured ?? false, coverImage: dto.coverImage || null, publishedAt: dto.status === 'ARCHIVED' ? null : new Date() } }); }
  async update(id: string, dto: UpdateProjectDto) { await this.findById(id); const data: Prisma.ProjectUpdateInput = {}; if (dto.title !== undefined) data.title = dto.title; if (dto.slug !== undefined) data.slug = slugify(dto.slug); if (dto.description !== undefined) data.description = dto.description; if (dto.longDescription !== undefined) data.longDescription = dto.longDescription || null; if (dto.technologies !== undefined) data.technologies = dto.technologies; if (dto.repository !== undefined) data.repository = dto.repository || null; if (dto.demo !== undefined) data.demo = dto.demo || null; if (dto.status !== undefined) { data.status = dto.status; data.publishedAt = dto.status === 'ARCHIVED' ? null : new Date(); } if (dto.featured !== undefined) data.featured = dto.featured; if (dto.coverImage !== undefined) data.coverImage = dto.coverImage || null; return this.prisma.project.update({ where: { id }, data }); }
  async findById(id: string) { const project = await this.prisma.project.findUnique({ where: { id } }); if (!project) throw new NotFoundException('Proyecto no encontrado'); return project; }
  async remove(id: string) { await this.findById(id); await this.prisma.project.delete({ where: { id } }); return { success: true }; }
}

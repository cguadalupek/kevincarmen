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
  async findBySlug(slug: string) { const project = await this.prisma.project.findUnique({ where: { slug } }); if (!project || project.status === 'ARCHIVED') throw new NotFoundException('Proyecto no encontrado'); return project; }
  async create(dto: CreateProjectDto) {
    const slug = slugify(dto.slug);
    if (!slug) throw new ConflictException('El slug no puede estar vacío');
    if (await this.prisma.project.findUnique({ where: { slug } })) throw new ConflictException('El slug ya existe');
    return this.prisma.project.create({ data: {
      title: dto.title, slug, description: dto.description, status: dto.status, coverImage: dto.coverImage,
      content: dto.content || null,
      longDescription: dto.longDescription || null, technologies: dto.technologies ?? [], category: dto.category || null,
      tags: dto.tags ?? [], projectYear: dto.projectYear ?? null, repository: dto.repository || null, demo: dto.demo || null,
      documentation: dto.documentation || null, problem: dto.problem || null, solution: dto.solution || null, role: dto.role || null,
      architecture: dto.architecture || null, architectureImage: dto.architectureImage || null,
      technicalDecisions: dto.technicalDecisions ?? [], challenges: dto.challenges ?? [], results: dto.results || null,
      learnings: dto.learnings || null, gallery: dto.gallery ?? [], featured: dto.featured ?? false,
      publishedAt: dto.status === 'ARCHIVED' ? null : new Date(),
    } });
  }
  async update(id: string, dto: UpdateProjectDto) {
    await this.findById(id);
    const data: Prisma.ProjectUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) {
      const slug = slugify(dto.slug);
      if (!slug) throw new ConflictException('El slug no puede estar vacío');
      const existing = await this.prisma.project.findUnique({ where: { slug } });
      if (existing && existing.id !== id) throw new ConflictException('El slug ya existe');
      data.slug = slug;
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) { data.status = dto.status; data.publishedAt = dto.status === 'ARCHIVED' ? null : new Date(); }
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage || null;
    if (dto.content !== undefined) data.content = dto.content || null;
    if (dto.longDescription !== undefined) data.longDescription = dto.longDescription || null;
    if (dto.technologies !== undefined) data.technologies = dto.technologies;
    if (dto.category !== undefined) data.category = dto.category || null;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.projectYear !== undefined) data.projectYear = dto.projectYear;
    if (dto.repository !== undefined) data.repository = dto.repository || null;
    if (dto.demo !== undefined) data.demo = dto.demo || null;
    if (dto.documentation !== undefined) data.documentation = dto.documentation || null;
    if (dto.problem !== undefined) data.problem = dto.problem || null;
    if (dto.solution !== undefined) data.solution = dto.solution || null;
    if (dto.role !== undefined) data.role = dto.role || null;
    if (dto.architecture !== undefined) data.architecture = dto.architecture || null;
    if (dto.architectureImage !== undefined) data.architectureImage = dto.architectureImage || null;
    if (dto.technicalDecisions !== undefined) data.technicalDecisions = dto.technicalDecisions;
    if (dto.challenges !== undefined) data.challenges = dto.challenges;
    if (dto.results !== undefined) data.results = dto.results || null;
    if (dto.learnings !== undefined) data.learnings = dto.learnings || null;
    if (dto.gallery !== undefined) data.gallery = dto.gallery;
    if (dto.featured !== undefined) data.featured = dto.featured;
    return this.prisma.project.update({ where: { id }, data });
  }
  async findById(id: string) { const project = await this.prisma.project.findUnique({ where: { id } }); if (!project) throw new NotFoundException('Proyecto no encontrado'); return project; }
  async remove(id: string) { await this.findById(id); await this.prisma.project.delete({ where: { id } }); return { success: true }; }
}

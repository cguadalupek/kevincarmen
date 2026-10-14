import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CreateProjectCategoryDto,
  UpdateProjectCategoryDto,
} from './dto/project-category.dto';

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Vista de una clasificación de proyectos (con cuántos proyectos la usan). */
export interface ProjectCategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  projectsCount: number;
}

/** Clasificación incluida en el listado de proyectos. */
const CATEGORY_SELECT = {
  select: { id: true, name: true, slug: true, position: true },
} as const;

/**
 * Orden del listado público: primero el orden manual (`position`), y dentro del mismo
 * hueco los destacados. Antes el orden era «destacados → updatedAt desc», así que la
 * migración numeró las filas existentes con ese mismo criterio.
 */
const PUBLIC_ORDER: Prisma.ProjectOrderByWithRelationInput[] = [
  { position: 'asc' },
  { featured: 'desc' },
  { updatedAt: 'desc' },
];

const ADMIN_ORDER: Prisma.ProjectOrderByWithRelationInput[] = [
  { position: 'asc' },
  { updatedAt: 'desc' },
];

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  findAllAdmin() {
    return this.prisma.project.findMany({
      orderBy: ADMIN_ORDER,
      include: { projectCategory: CATEGORY_SELECT },
    });
  }

  findPublished() {
    return this.prisma.project.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: PUBLIC_ORDER,
      include: { projectCategory: CATEGORY_SELECT },
    });
  }

  async findBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: { projectCategory: CATEGORY_SELECT },
    });
    if (!project || project.status === 'ARCHIVED') {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  // ── Clasificaciones (tabla editable, como las categorías del blog) ─────────

  async findAllCategories(): Promise<ProjectCategoryView[]> {
    const rows = await this.prisma.projectCategory.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { projects: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      position: row.position,
      projectsCount: row._count.projects,
    }));
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.projectCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Clasificación no encontrada');
    return category;
  }

  /** Siguiente hueco libre al final (último + 10): sin esto toda fila nueva nacía 0. */
  private async nextCategoryPosition(): Promise<number> {
    const last = await this.prisma.projectCategory.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? 0) + 10;
  }

  private async nextProjectPosition(): Promise<number> {
    const last = await this.prisma.project.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? 0) + 10;
  }

  async createCategory(dto: CreateProjectCategoryDto) {
    const name = dto.name.trim();
    const slug = slugify(dto.slug?.trim() || name);
    if (!slug) throw new ConflictException('El slug no puede estar vacío');
    const position = dto.position ?? (await this.nextCategoryPosition());
    try {
      return await this.prisma.projectCategory.create({
        data: {
          name,
          slug,
          description: dto.description?.trim() || null,
          position,
        },
      });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe una clasificación con ese nombre o slug');
    }
  }

  /**
   * Renombrar una clasificación arrastra el nombre denormalizado en `projects.category`,
   * que es lo que leen las tarjetas públicas: sin esta sincronización la web seguiría
   * mostrando el nombre viejo.
   */
  async updateCategory(id: string, dto: UpdateProjectCategoryDto) {
    const current = await this.findCategoryById(id);
    const data: Prisma.ProjectCategoryUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.position !== undefined) data.position = dto.position;
    let renamedTo: string | null = null;
    if (dto.name !== undefined && dto.name.trim() && dto.name.trim() !== current.name) {
      renamedTo = dto.name.trim();
      data.name = renamedTo;
    }
    if (dto.slug !== undefined) {
      const slug = slugify(dto.slug);
      if (!slug) throw new ConflictException('El slug no puede estar vacío');
      data.slug = slug;
    }

    try {
      const updated = await this.prisma.projectCategory.update({ where: { id }, data });
      if (renamedTo) {
        await this.prisma.project.updateMany({
          where: { projectCategoryId: id },
          data: { category: renamedTo },
        });
      }
      return updated;
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe una clasificación con ese nombre o slug');
    }
  }

  async deleteCategory(id: string) {
    await this.findCategoryById(id);
    const uses = await this.prisma.project.count({ where: { projectCategoryId: id } });
    if (uses > 0) {
      throw new ConflictException(
        `No se puede eliminar: la usan ${uses} proyecto(s). Cámbiales la clasificación primero.`,
      );
    }
    await this.prisma.projectCategory.delete({ where: { id } });
    return { success: true };
  }

  /** Reordena clasificaciones (índice = posición) y devuelve la lista ya ordenada. */
  async reorderCategories(categoryIds: string[]): Promise<ProjectCategoryView[]> {
    const found = await this.prisma.projectCategory.count({ where: { id: { in: categoryIds } } });
    if (found !== categoryIds.length) {
      throw new BadRequestException('Alguna de las clasificaciones a reordenar no existe');
    }
    await this.prisma.$transaction(
      categoryIds.map((id, index) =>
        this.prisma.projectCategory.update({
          where: { id },
          data: { position: (index + 1) * 10 },
        }),
      ),
    );
    return this.findAllCategories();
  }

  /** Reordena los proyectos del panel (índice = posición) → mismo orden en el sitio. */
  async reorderProjects(projectIds: string[]) {
    const found = await this.prisma.project.count({ where: { id: { in: projectIds } } });
    if (found !== projectIds.length) {
      throw new BadRequestException('Alguno de los proyectos a reordenar no existe');
    }
    await this.prisma.$transaction(
      projectIds.map((id, index) =>
        this.prisma.project.update({ where: { id }, data: { position: (index + 1) * 10 } }),
      ),
    );
    return this.findAllAdmin();
  }

  /**
   * Resuelve la clasificación que llega del formulario:
   * - `projectCategoryId` (lo normal) → nombre + id.
   * - `category` (nombre suelto, compatibilidad) → se enlaza si existe esa clasificación.
   * - `projectCategoryId: ''` → se quita la clasificación.
   */
  private async resolveCategory(
    projectCategoryId?: string,
    category?: string,
  ): Promise<{ projectCategoryId: string | null; category: string | null }> {
    if (projectCategoryId !== undefined) {
      const id = projectCategoryId.trim();
      if (!id) return { projectCategoryId: null, category: null };
      const row = await this.findCategoryById(id);
      return { projectCategoryId: row.id, category: row.name };
    }
    if (category !== undefined) {
      const name = category.trim();
      if (!name) return { projectCategoryId: null, category: null };
      const row = await this.prisma.projectCategory.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
      });
      return { projectCategoryId: row?.id ?? null, category: row?.name ?? name };
    }
    return { projectCategoryId: null, category: null };
  }

  async create(dto: CreateProjectDto) {
    const slug = slugify(dto.slug);
    if (!slug) throw new ConflictException('El slug no puede estar vacío');
    if (await this.prisma.project.findUnique({ where: { slug } })) {
      throw new ConflictException('El slug ya existe');
    }
    const { projectCategoryId, category } = await this.resolveCategory(
      dto.projectCategoryId,
      dto.category,
    );
    return this.prisma.project.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        status: dto.status,
        coverImage: dto.coverImage,
        content: dto.content || null,
        longDescription: dto.longDescription || null,
        technologies: dto.technologies ?? [],
        category,
        projectCategoryId,
        position: dto.position ?? (await this.nextProjectPosition()),
        tags: dto.tags ?? [],
        projectYear: dto.projectYear ?? null,
        repository: dto.repository || null,
        demo: dto.demo || null,
        documentation: dto.documentation || null,
        problem: dto.problem || null,
        solution: dto.solution || null,
        role: dto.role || null,
        architecture: dto.architecture || null,
        architectureImage: dto.architectureImage || null,
        technicalDecisions: dto.technicalDecisions ?? [],
        challenges: dto.challenges ?? [],
        results: dto.results || null,
        learnings: dto.learnings || null,
        gallery: dto.gallery ?? [],
        featured: dto.featured ?? false,
        publishedAt: dto.status === 'ARCHIVED' ? null : new Date(),
      },
    });
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
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.publishedAt = dto.status === 'ARCHIVED' ? null : new Date();
    }
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage || null;
    if (dto.content !== undefined) data.content = dto.content || null;
    if (dto.longDescription !== undefined) data.longDescription = dto.longDescription || null;
    if (dto.technologies !== undefined) data.technologies = dto.technologies;
    if (dto.projectCategoryId !== undefined || dto.category !== undefined) {
      const resolved = await this.resolveCategory(dto.projectCategoryId, dto.category);
      data.projectCategory = resolved.projectCategoryId
        ? { connect: { id: resolved.projectCategoryId } }
        : { disconnect: true };
      data.category = resolved.category;
    }
    if (dto.position !== undefined) data.position = dto.position;
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

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  private toSlugConflict(error: unknown, message: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(message);
    }
    throw error;
  }
}

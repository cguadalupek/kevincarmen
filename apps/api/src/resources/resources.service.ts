import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { CreateResourceTypeDto, UpdateResourceTypeDto } from './dto/resource-type.dto';

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

/** Tipo editable incluido en el listado de recursos. */
const RESOURCE_TYPE_SELECT = {
  select: { id: true, name: true, slug: true, icon: true },
} as const;

/** Vista de un tipo de recurso (con cuántos recursos lo usan). */
export interface ResourceTypeView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  position: number;
  resourcesCount: number;
}

const TYPE_ORDER: Prisma.ResourceTypeOrderByWithRelationInput[] = [
  { position: 'asc' },
  { name: 'asc' },
];

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  /** Solo recursos publicados, destacados primero y luego por posición. */
  async findPublished() {
    return this.prisma.resource.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }],
      include: { resourceType: RESOURCE_TYPE_SELECT },
    });
  }

  async findAllAdmin() {
    return this.prisma.resource.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: { resourceType: RESOURCE_TYPE_SELECT },
    });
  }

  async findBySlug(slug: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { slug },
      include: { resourceType: RESOURCE_TYPE_SELECT },
    });
    if (!resource || !resource.published) throw new NotFoundException('Recurso no encontrado');
    return resource;
  }

  async findById(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: { resourceType: RESOURCE_TYPE_SELECT },
    });
    if (!resource) throw new NotFoundException('Recurso no encontrado');
    return resource;
  }

  /**
   * Traduce el id que manda el formulario al vínculo del recurso.
   * `undefined` = no se toca; `''` = se quita el tipo.
   */
  private async resolveType(resourceTypeId?: string): Promise<string | null | undefined> {
    if (resourceTypeId === undefined) return undefined;
    const id = resourceTypeId.trim();
    if (!id) return null;
    const type = await this.prisma.resourceType.findUnique({ where: { id }, select: { id: true } });
    if (!type) throw new NotFoundException('El tipo de recurso no existe');
    return type.id;
  }

  async create(dto: CreateResourceDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.resource.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('El slug ya existe');

    const resourceTypeId = (await this.resolveType(dto.resourceTypeId)) ?? null;

    const created = await this.prisma.resource.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        // El enum legado sólo se escribe si el cliente lo manda (clientes antiguos).
        ...(dto.type ? { type: dto.type } : {}),
        resourceTypeId,
        fileUrl: dto.fileUrl?.trim() || null,
        fileName: dto.fileName?.trim() || null,
        fileSize: dto.fileSize ?? null,
        version: dto.version?.trim() || null,
        tags: dto.tags ?? [],
        published: dto.published ?? true,
        featured: dto.featured ?? false,
        position: dto.position ?? 0,
      },
      include: { resourceType: RESOURCE_TYPE_SELECT },
    });
    return created;
  }

  async update(id: string, dto: UpdateResourceDto) {
    await this.findById(id);
    const data: Prisma.ResourceUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined && dto.slug.trim()) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    const resourceTypeId = await this.resolveType(dto.resourceTypeId);
    if (resourceTypeId !== undefined) {
      data.resourceType = resourceTypeId ? { connect: { id: resourceTypeId } } : { disconnect: true };
    }
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl?.trim() || null;
    if (dto.fileName !== undefined) data.fileName = dto.fileName?.trim() || null;
    if (dto.fileSize !== undefined) data.fileSize = dto.fileSize ?? null;
    if (dto.version !== undefined) data.version = dto.version?.trim() || null;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.published !== undefined) data.published = dto.published;
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.position !== undefined) data.position = dto.position;
    return this.prisma.resource.update({
      where: { id },
      data,
      include: { resourceType: RESOURCE_TYPE_SELECT },
    });
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

  // ── Tipos de recurso (Recursos › Tipos) ────────────────────────────────────

  async findAllTypes(): Promise<ResourceTypeView[]> {
    const rows = await this.prisma.resourceType.findMany({
      orderBy: TYPE_ORDER,
      include: { _count: { select: { resources: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      position: row.position,
      resourcesCount: row._count.resources,
    }));
  }

  async findTypeById(id: string) {
    const type = await this.prisma.resourceType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Tipo de recurso no encontrado');
    return type;
  }

  /** Siguiente hueco libre al final (último + 10): sin esto toda fila nacía 0. */
  private async nextTypePosition(): Promise<number> {
    const last = await this.prisma.resourceType.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? 0) + 10;
  }

  async createType(dto: CreateResourceTypeDto) {
    const name = dto.name.trim();
    const slug = slugify(dto.slug?.trim() || name);
    if (!slug) throw new ConflictException('El slug no puede estar vacío');
    const position = dto.position ?? (await this.nextTypePosition());
    try {
      return await this.prisma.resourceType.create({
        data: {
          name,
          slug,
          description: dto.description?.trim() || null,
          icon: dto.icon ?? 'file',
          position,
        },
      });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe un tipo con ese nombre o slug');
    }
  }

  async updateType(id: string, dto: UpdateResourceTypeDto) {
    await this.findTypeById(id);
    const data: Prisma.ResourceTypeUpdateInput = {};
    if (dto.name !== undefined && dto.name.trim()) data.name = dto.name.trim();
    if (dto.slug !== undefined) {
      const slug = slugify(dto.slug);
      if (!slug) throw new ConflictException('El slug no puede estar vacío');
      data.slug = slug;
    }
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.position !== undefined) data.position = dto.position;
    try {
      return await this.prisma.resourceType.update({ where: { id }, data });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe un tipo con ese nombre o slug');
    }
  }

  /**
   * Un tipo en uso no se elimina: los recursos quedarían sin tipo sin que nadie lo
   * pida (mismo criterio que las clasificaciones de proyectos y las categorías).
   */
  async deleteType(id: string) {
    await this.findTypeById(id);
    const uses = await this.prisma.resource.count({ where: { resourceTypeId: id } });
    if (uses > 0) {
      throw new ConflictException(
        `No se puede eliminar: lo usan ${uses} recurso(s). Cámbiales el tipo primero.`,
      );
    }
    await this.prisma.resourceType.delete({ where: { id } });
    return { success: true };
  }

  /** Reordena los tipos (índice = posición) y devuelve la lista ya ordenada. */
  async reorderTypes(typeIds: string[]): Promise<ResourceTypeView[]> {
    const found = await this.prisma.resourceType.count({ where: { id: { in: typeIds } } });
    if (found !== typeIds.length) {
      throw new BadRequestException('Alguno de los tipos a reordenar no existe');
    }
    await this.prisma.$transaction(
      typeIds.map((id, index) =>
        this.prisma.resourceType.update({
          where: { id },
          data: { position: (index + 1) * 10 },
        }),
      ),
    );
    return this.findAllTypes();
  }

  private toSlugConflict(error: unknown, message: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(message);
    }
    throw error;
  }
}

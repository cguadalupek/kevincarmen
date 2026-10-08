import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Subcategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

export interface SubcategoryView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
}

export interface MainCategoryView {
  id: string;
  /** Alias de slug, lo que viaja en la URL (`?category=<value>`). */
  value: string;
  label: string;
  description: string | null;
  position: number;
  /** Clave de color de la paleta (elegida al crear la categoría). */
  color: string;
  subcategories: SubcategoryView[];
}

const ORDER: Prisma.MainCategoryOrderByWithRelationInput[] = [{ position: 'asc' }, { name: 'asc' }];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Árbol completo de categorías → subcategorías, tal cual está en la BD.
   * Como son editables, esto refleja siempre el estado actual.
   */
  async findTree(): Promise<MainCategoryView[]> {
    const [mains, subs] = await Promise.all([
      this.prisma.mainCategory.findMany({ orderBy: ORDER }),
      this.prisma.subcategory.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const subsByMain = new Map<string, SubcategoryView[]>();
    for (const sub of subs) {
      const list = subsByMain.get(sub.mainCategoryId) ?? [];
      list.push(this.toView(sub));
      subsByMain.set(sub.mainCategoryId, list);
    }

    return mains.map((main) => ({
      id: main.id,
      value: main.slug,
      label: main.name,
      description: main.description,
      position: main.position,
      color: main.color,
      subcategories: subsByMain.get(main.id) ?? [],
    }));
  }

  /** Lista plana de subcategorías, opcionalmente acotada a una principal (por slug). */
  async findAllSubcategories(mainSlug?: string): Promise<SubcategoryView[]> {
    const subs = await this.prisma.subcategory.findMany({
      where: mainSlug ? { mainCategory: { slug: mainSlug } } : undefined,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return subs.map((sub) => this.toView(sub));
  }

  async findMainById(id: string) {
    const main = await this.prisma.mainCategory.findUnique({ where: { id } });
    if (!main) throw new NotFoundException('Categoría principal no encontrada');
    return main;
  }

  async findMainIdBySlug(slug: string): Promise<string | null> {
    const main = await this.prisma.mainCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    return main?.id ?? null;
  }

  /**
   * Comprueba que la subcategoría exista y cuelgue de esa categoría principal.
   * Devuelve la subcategoría o `null`. El trigger de Postgres también lo impide,
   * pero aquí convertimos el error en un 400 legible para el CMS.
   */
  async findMatching(
    subCategoryId: string,
    mainCategoryId: string,
  ): Promise<SubcategoryView | null> {
    const sub = await this.prisma.subcategory.findFirst({
      where: { id: subCategoryId, mainCategoryId },
    });
    return sub ? this.toView(sub) : null;
  }

  // ── CRUD categorías principales ──────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.mainCategory.create({ data: dto });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe una categoría con ese slug');
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.findMainById(id);
    try {
      return await this.prisma.mainCategory.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe una categoría con ese slug');
    }
  }

  async deleteCategory(id: string) {
    await this.findMainById(id);

    const [posts, subcategories] = await Promise.all([
      this.prisma.post.count({ where: { mainCategoryId: id } }),
      this.prisma.subcategory.count({ where: { mainCategoryId: id } }),
    ]);

    if (posts > 0 || subcategories > 0) {
      throw new ConflictException(
        `No se puede eliminar: esta categoría la usan ${posts} artículo(s) y tiene ${subcategories} subcategoría(s). Mueve o elimina eso primero.`,
      );
    }

    await this.prisma.mainCategory.delete({ where: { id } });
    return { success: true };
  }

  // ── CRUD subcategorías ───────────────────────────────────────────────────

  private async assertMainExists(mainCategoryId: string) {
    const exists = await this.prisma.mainCategory.findUnique({
      where: { id: mainCategoryId },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException('La categoría principal indicada no existe');
    }
  }

  async createSubcategory(dto: CreateSubcategoryDto) {
    await this.assertMainExists(dto.mainCategoryId);
    try {
      return await this.prisma.subcategory.create({ data: dto });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe una subcategoría con ese slug en esa categoría');
    }
  }

  async updateSubcategory(id: string, dto: UpdateSubcategoryDto) {
    if (dto.mainCategoryId) await this.assertMainExists(dto.mainCategoryId);
    try {
      return await this.prisma.subcategory.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.toSlugConflict(error, 'Ya existe una subcategoría con ese slug en esa categoría');
    }
  }

  async deleteSubcategory(id: string) {
    const uses = await this.prisma.post.count({ where: { subCategoryId: id } });
    if (uses > 0) {
      throw new ConflictException(
        `No se puede eliminar: la usan ${uses} artículo(s). Quítala de esos artículos primero.`,
      );
    }
    await this.prisma.subcategory.delete({ where: { id } });
    return { success: true };
  }

  private toSlugConflict(error: unknown, message: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(message);
    }
    throw error;
  }

  private toView(sub: Subcategory): SubcategoryView {
    return {
      id: sub.id,
      slug: sub.slug,
      name: sub.name,
      description: sub.description,
      position: sub.position,
    };
  }
}

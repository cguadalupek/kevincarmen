import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechCategoryDto, UpdateTechCategoryDto } from './dto/tech-category.dto';
import { CreateTechItemDto, UpdateTechItemDto } from './dto/tech-item.dto';
import { ReorderTechDto } from './dto/reorder-tech.dto';

@Injectable()
export class TechService {
  constructor(private prisma: PrismaService) {}

  /** Grid público (y admin): categorías con sus ítems, ordenados. */
  async listCategories() {
    const categories = await this.prisma.techCategory.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { items: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
    });
    return categories;
  }

  async createCategory(dto: CreateTechCategoryDto) {
    const { _max } = await this.prisma.techCategory.aggregate({ _max: { position: true } });
    return this.prisma.techCategory.create({
      data: { name: dto.name, position: (_max.position ?? -1) + 1 },
    });
  }

  async updateCategory(id: string, dto: UpdateTechCategoryDto) {
    const row = await this.prisma.techCategory.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Categoría de tecnología no encontrada');
    return this.prisma.techCategory.update({ where: { id }, data: { name: dto.name } });
  }

  async removeCategory(id: string) {
    const row = await this.prisma.techCategory.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Categoría de tecnología no encontrada');
    await this.prisma.techCategory.delete({ where: { id } });
    return { success: true };
  }

  async createItem(dto: CreateTechItemDto) {
    const category = await this.prisma.techCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría de tecnología no encontrada');
    const { _max } = await this.prisma.techItem.aggregate({
      where: { categoryId: dto.categoryId },
      _max: { position: true },
    });
    return this.prisma.techItem.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        position: (_max.position ?? -1) + 1,
      },
    });
  }

  async updateItem(id: string, dto: UpdateTechItemDto) {
    const row = await this.prisma.techItem.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Tecnología no encontrada');
    const data: { name?: string; categoryId?: string } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.categoryId !== undefined) {
      const category = await this.prisma.techCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Categoría de tecnología no encontrada');
      data.categoryId = dto.categoryId;
    }
    return this.prisma.techItem.update({ where: { id }, data });
  }

  async removeItem(id: string) {
    const row = await this.prisma.techItem.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Tecnología no encontrada');
    await this.prisma.techItem.delete({ where: { id } });
    return { success: true };
  }

  /** Reordena categorías y/o ítems: las posiciones se derivan del orden del array. */
  async reorder(dto: ReorderTechDto) {
    if (dto.categoryIds?.length) {
      await this.prisma.$transaction(
        dto.categoryIds.map((id, index) =>
          this.prisma.techCategory.update({ where: { id }, data: { position: index } }),
        ),
      );
    }
    if (dto.itemIds?.length) {
      await this.prisma.$transaction(
        dto.itemIds.map((id, index) =>
          this.prisma.techItem.update({ where: { id }, data: { position: index } }),
        ),
      );
    }
    return this.listCategories();
  }
}
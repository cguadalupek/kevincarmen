import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /** Público: árbol principal → subcategorías (para el blog y el formulario). */
  @Get()
  findTree() {
    return this.categories.findTree();
  }

  /** Público: lista plana de subcategorías, opcionalmente por principal. */
  @Get('flat')
  findFlat(@Query('category') category?: string) {
    return this.categories.findAllSubcategories(category);
  }

  // ── CRUD categorías principales (solo admin) ──
  @Post()
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categories.createCategory(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.updateCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteCategory(@Param('id') id: string) {
    return this.categories.deleteCategory(id);
  }

  // ── CRUD subcategorías (solo admin) ──
  @Post('subcategories')
  @UseGuards(JwtAuthGuard)
  createSubcategory(@Body() dto: CreateSubcategoryDto) {
    return this.categories.createSubcategory(dto);
  }

  @Put('subcategories/:id')
  @UseGuards(JwtAuthGuard)
  updateSubcategory(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.categories.updateSubcategory(id, dto);
  }

  @Delete('subcategories/:id')
  @UseGuards(JwtAuthGuard)
  deleteSubcategory(@Param('id') id: string) {
    return this.categories.deleteSubcategory(id);
  }
}

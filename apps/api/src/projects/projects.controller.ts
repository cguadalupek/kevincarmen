import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CreateProjectCategoryDto,
  ReorderProjectCategoriesDto,
  ReorderProjectsDto,
  UpdateProjectCategoryDto,
} from './dto/project-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get() findPublished() {
    return this.projectsService.findPublished();
  }

  /** Público: clasificaciones editables (alimentan el filtro de /proyectos). */
  @Get('categories') findCategories() {
    return this.projectsService.findAllCategories();
  }

  @Get('admin/all') @UseGuards(JwtAuthGuard) findAllAdmin() {
    return this.projectsService.findAllAdmin();
  }

  // ── Rutas con nombre fijo ANTES de `:slug` / `:id` (Nest resuelve por orden) ──

  @Put('reorder') @UseGuards(JwtAuthGuard) reorderProjects(@Body() dto: ReorderProjectsDto) {
    return this.projectsService.reorderProjects(dto.projectIds);
  }

  @Put('categories/reorder') @UseGuards(JwtAuthGuard) reorderCategories(
    @Body() dto: ReorderProjectCategoriesDto,
  ) {
    return this.projectsService.reorderCategories(dto.categoryIds);
  }

  @Post('categories') @UseGuards(JwtAuthGuard) createCategory(
    @Body() dto: CreateProjectCategoryDto,
  ) {
    return this.projectsService.createCategory(dto);
  }

  @Put('categories/:id') @UseGuards(JwtAuthGuard) updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateProjectCategoryDto,
  ) {
    return this.projectsService.updateCategory(id, dto);
  }

  @Delete('categories/:id') @UseGuards(JwtAuthGuard) deleteCategory(@Param('id') id: string) {
    return this.projectsService.deleteCategory(id);
  }

  @Get(':slug') findBySlug(@Param('slug') slug: string) {
    return this.projectsService.findBySlug(slug);
  }

  @Post() @UseGuards(JwtAuthGuard) create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Put(':id') @UseGuards(JwtAuthGuard) update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id') @UseGuards(JwtAuthGuard) remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}

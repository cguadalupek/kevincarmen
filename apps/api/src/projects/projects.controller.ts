import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}
  @Get() findPublished() { return this.projectsService.findPublished(); }
  @Get('admin/all') @UseGuards(JwtAuthGuard) findAllAdmin() { return this.projectsService.findAllAdmin(); }
  @Get(':slug') findBySlug(@Param('slug') slug: string) { return this.projectsService.findBySlug(slug); }
  @Post() @UseGuards(JwtAuthGuard) create(@Body() dto: CreateProjectDto) { return this.projectsService.create(dto); }
  @Put(':id') @UseGuards(JwtAuthGuard) update(@Param('id') id: string, @Body() dto: UpdateProjectDto) { return this.projectsService.update(id, dto); }
  @Delete(':id') @UseGuards(JwtAuthGuard) remove(@Param('id') id: string) { return this.projectsService.remove(id); }
}

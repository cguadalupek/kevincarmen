import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SaveCurriculumDto } from './dto/curriculum.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findPublished() {
    return this.coursesService.findPublished();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.coursesService.findAllAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  /** Curso público por slug, con módulos y clases publicadas. */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  /** Guarda el árbol completo (módulos + clases) en una sola operación. */
  @Put(':id/curriculum')
  @UseGuards(JwtAuthGuard)
  saveCurriculum(@Param('id') id: string, @Body() dto: SaveCurriculumDto) {
    return this.coursesService.saveCurriculum(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
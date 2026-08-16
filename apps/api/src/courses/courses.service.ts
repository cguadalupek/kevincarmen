import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

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

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAllAdmin() {
    return this.prisma.course.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] });
  }

  async findPublished() {
    return this.prisma.course.findMany({
      where: { status: { in: ['AVAILABLE', 'IN_PROGRESS', 'COMING_SOON'] } },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return course;
  }

  async create(dto: CreateCourseDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('El slug ya existe');
    return this.prisma.course.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        level: dto.level,
        duration: dto.duration,
        lessonsCount: dto.lessonsCount ?? 0,
        status: dto.status,
        coverImage: dto.coverImage || null,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findById(id);
    const data: Prisma.CourseUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.duration !== undefined) data.duration = dto.duration;
    if (dto.lessonsCount !== undefined) data.lessonsCount = dto.lessonsCount;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage || null;
    if (dto.position !== undefined) data.position = dto.position;
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.course.delete({ where: { id } });
    return { success: true };
  }
}
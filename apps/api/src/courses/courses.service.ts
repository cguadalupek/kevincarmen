import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SaveCurriculumDto } from './dto/curriculum.dto';

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

/** Quita el prefijo temporal "new-..." de los ids del editor (se convierten en creación). */
function isTemporaryId(id?: string | null) {
  return !id || id.startsWith('new-');
}

/** Convierte "" o undefined en null para columnas nullable. */
function emptyToNull(value?: string | null) {
  if (value === undefined || value === null) return value ?? null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Include común para el árbol de un curso (admin: todas las clases). */
const curriculumInclude = {
  modules: {
    orderBy: [{ position: 'asc' }],
    include: {
      lessons: { orderBy: [{ position: 'asc' }] },
    },
  },
} satisfies Prisma.CourseInclude;

/** Include para el árbol público (solo clases publicadas). */
const publicCurriculumInclude = {
  modules: {
    orderBy: [{ position: 'asc' }],
    include: {
      lessons: {
        where: { published: true },
        orderBy: [{ position: 'asc' }],
      },
    },
  },
} satisfies Prisma.CourseInclude;

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /** Tipado explícito: la inferencia de `findMany` se rompe si el `where` usa strings planos. */
  private readonly publishedStatuses: CourseStatus[] = [
    'AVAILABLE',
    'IN_PROGRESS',
    'COMING_SOON',
  ];

  /** Lista pública para tarjetas: incluye conteos reales desde el árbol. */
  async findPublished() {
    const courses = await this.prisma.course.findMany({
      where: { status: { in: this.publishedStatuses } },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        modules: {
          select: {
            id: true,
            lessons: {
              where: { published: true },
              select: { id: true, duration: true },
            },
          },
        },
      },
    });

    return courses.map((course) => {
      const lessons = course.modules.flatMap((m) => m.lessons);
      const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
      return {
        ...course,
        modulesCount: course.modules.length,
        lessonsCount: lessons.length,
        totalMinutes,
        /** Ids de clases publicadas (para el progreso local del alumno). */
        lessonIds: lessons.map((l) => l.id),
        modules: undefined,
      };
    });
  }

  /** Todos los cursos (admin), con conteos reales. */
  async findAllAdmin() {
    const courses = await this.prisma.course.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        modules: {
          select: {
            id: true,
            lessons: { select: { id: true, published: true, duration: true } },
          },
        },
      },
    });

    return courses.map((course) => {
      const lessons = course.modules.flatMap((m) => m.lessons);
      return {
        ...course,
        modulesCount: course.modules.length,
        lessonsCount: lessons.length,
        totalMinutes: lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
        modules: undefined,
      };
    });
  }

  /** Curso con su árbol completo para el editor (incluye clases no publicadas). */
  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: curriculumInclude,
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return this.withTotals(course);
  }

  /** Curso público por slug, con árbol de clases publicadas. 404 si no existe. */
  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: publicCurriculumInclude,
    });
    if (!course || !this.publishedStatuses.includes(course.status)) {
      throw new NotFoundException('Curso no encontrado');
    }
    return this.withTotals(course);
  }

  private withTotals(course: Prisma.CourseGetPayload<{ include: typeof curriculumInclude }>) {
    const lessons = course.modules.flatMap((m) => m.lessons);
    const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
    return {
      ...course,
      lessonsCount: lessons.length,
      totalMinutes,
    };
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
        subtitle: emptyToNull(dto.subtitle),
        level: dto.level,
        duration: dto.duration,
        lessonsCount: dto.lessonsCount ?? 0,
        status: dto.status,
        coverImage: emptyToNull(dto.coverImage),
        position: dto.position ?? 0,
        learningPoints: dto.learningPoints ?? [],
        requirements: dto.requirements ?? [],
        targetAudience: emptyToNull(dto.targetAudience),
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findById(id);
    const data: Prisma.CourseUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.subtitle !== undefined) data.subtitle = emptyToNull(dto.subtitle);
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.duration !== undefined) data.duration = dto.duration;
    if (dto.lessonsCount !== undefined) data.lessonsCount = dto.lessonsCount;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.coverImage !== undefined) data.coverImage = emptyToNull(dto.coverImage);
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.learningPoints !== undefined) data.learningPoints = dto.learningPoints;
    if (dto.requirements !== undefined) data.requirements = dto.requirements;
    if (dto.targetAudience !== undefined) data.targetAudience = emptyToNull(dto.targetAudience);
    return this.prisma.course.update({ where: { id }, data });
  }

  /**
   * Guarda el curriculum completo (módulos + clases) de una vez, en una
   * transacción: los nodos con id existente se actualizan, los nuevos se crean
   * y los que ya no aparecen se borran (cascade a sus clases).
   */
  async saveCurriculum(courseId: string, dto: SaveCurriculumDto) {
    await this.findById(courseId);

    // Slugs únicos dentro del curso (las URLs de clase dependen de esto).
    const usedSlugs = new Set<string>();
    const resolveSlug = (title: string, requested?: string) => {
      const base = slugify(requested?.trim() ? requested : title) || 'clase';
      let slug = base;
      let n = 2;
      while (usedSlugs.has(slug)) {
        slug = `${base}-${n}`;
        n += 1;
      }
      usedSlugs.add(slug);
      return slug;
    };

    await this.prisma.$transaction(async (tx) => {
      // Borra módulos que ya no están (las clases se borran en cascada).
      const keepModuleIds = dto.modules.filter((m) => !isTemporaryId(m.id)).map((m) => m.id as string);
      await tx.courseModule.deleteMany({
        where: { courseId, id: { notIn: keepModuleIds } },
      });

      for (const [modIndex, moduleDto] of dto.modules.entries()) {
        let moduleId = moduleDto.id && !isTemporaryId(moduleDto.id) ? moduleDto.id : undefined;

        const moduleData = {
          title: moduleDto.title,
          description: emptyToNull(moduleDto.description),
          position: modIndex,
        };

        if (moduleId) {
          await tx.courseModule.update({ where: { id: moduleId }, data: moduleData });
        } else {
          moduleId = (
            await tx.courseModule.create({
              data: { courseId, ...moduleData },
            })
          ).id;
        }

        const lessons = moduleDto.lessons ?? [];
        const keepLessonIds = lessons
          .filter((l) => !isTemporaryId(l.id))
          .map((l) => l.id as string);
        await tx.lesson.deleteMany({
          where: { moduleId, id: { notIn: keepLessonIds } },
        });

        for (const [lessonIndex, lessonDto] of lessons.entries()) {
          const lessonId =
            lessonDto.id && !isTemporaryId(lessonDto.id) ? lessonDto.id : undefined;
          const slug = resolveSlug(lessonDto.title, lessonDto.slug);

          const lessonData: Prisma.LessonUpdateInput = {
            title: lessonDto.title,
            slug,
            description: emptyToNull(lessonDto.description),
            type: lessonDto.type,
            videoUrl: emptyToNull(lessonDto.videoUrl),
            videoType: lessonDto.videoType,
            content: emptyToNull(lessonDto.content),
            duration: lessonDto.duration ?? 0,
            isFree: lessonDto.isFree ?? true,
            published: lessonDto.published ?? true,
            position: lessonIndex,
          };
          if (lessonDto.resources !== undefined) {
            lessonData.resources =
              (lessonDto.resources as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
          }

          if (lessonId) {
            await tx.lesson.update({ where: { id: lessonId }, data: lessonData });
          } else {
            await tx.lesson.create({
              data: {
                ...(lessonData as Prisma.LessonCreateInput),
                module: { connect: { id: moduleId } },
              },
            });
          }
        }
      }

      // lessons_count = clases publicadas (lo que ve el público en las tarjetas).
      const publishedCount = await tx.lesson.count({
        where: { module: { courseId }, published: true },
      });
      await tx.course.update({
        where: { id: courseId },
        data: { lessonsCount: publishedCount },
      });
    });

    return this.findById(courseId);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.course.delete({ where: { id } });
    return { success: true };
  }
}
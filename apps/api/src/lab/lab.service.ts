import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

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

function normalizeStoredUrl(value?: string | null) {
  if (!value) return value;
  try {
    const url = new URL(value);
    const configuredHosts = new Set(
      (process.env.PUBLIC_SITE_HOSTS ?? '')
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    );
    const isPrivateHost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname);

    if (isPrivateHost || configuredHosts.has(url.hostname.toLowerCase())) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Relative paths are already in the desired format.
  }
  return value;
}

function normalizeStoredContent(content: string) {
  return content.replace(/https?:\/\/[^\s"'<>]+/g, (value) => {
    const normalized = normalizeStoredUrl(value);
    return normalized ?? value;
  });
}

function readingTimeOf(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}

function parseChapters(value: unknown): Prisma.InputJsonValue {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (chapter): chapter is { time: string; title: string } =>
        typeof chapter === 'object' &&
        chapter !== null &&
        typeof (chapter as { time?: unknown }).time === 'string' &&
        typeof (chapter as { title?: unknown }).title === 'string',
    )
    .map((chapter) => ({ time: chapter.time.trim(), title: chapter.title.trim() }))
    .filter((chapter) => chapter.time || chapter.title);
}

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async findAllAdmin() {
    return this.prisma.labExperiment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /** Solo experimentos publicados, el más reciente primero (por fecha de inicio). */
  async findPublished() {
    return this.prisma.labExperiment.findMany({
      where: { published: true },
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    const item = await this.prisma.labExperiment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Experimento no encontrado');
    return item;
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.labExperiment.findUnique({ where: { slug } });
    if (!item || !item.published) throw new NotFoundException('Experimento no encontrado');
    return item;
  }

  async create(dto: CreateLabDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.labExperiment.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('El slug ya existe');

    const content = normalizeStoredContent(dto.content ?? '');

    return this.prisma.labExperiment.create({
      data: {
        title: dto.title,
        // Compatibilidad con la columna legacy que sigue siendo NOT NULL
        // en instalaciones que aún no han compactado lab_services.
        name: dto.title,
        slug,
        description: dto.description,
        objective: dto.objective,
        hypothesis: dto.hypothesis,
        environment: dto.environment,
        procedure: dto.procedure,
        status: dto.status,
        result: dto.result,
        conclusion: dto.conclusion,
        stack: dto.stack ?? [],
        tags: dto.tags ?? [],
        coverImage: normalizeStoredUrl(dto.coverImage) || null,
        gallery: dto.gallery ?? [],
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        relatedPostId: dto.relatedPostId || null,
        relatedProjectId: dto.relatedProjectId || null,
        content,
        videoUrl: normalizeStoredUrl(dto.videoUrl) || null,
        videoDuration: dto.videoDuration ?? null,
        chapters: parseChapters(dto.chapters),
        published: dto.published ?? false,
        readingTime: readingTimeOf(content),
      },
    });
  }

  async update(id: string, dto: UpdateLabDto) {
    await this.findById(id);
    const data: Prisma.LabExperimentUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      // Mantener sincronizado el campo legacy mientras exista en la tabla.
      data.name = dto.title;
    }
    if (dto.slug !== undefined && dto.slug.trim()) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.objective !== undefined) data.objective = dto.objective || null;
    if (dto.hypothesis !== undefined) data.hypothesis = dto.hypothesis || null;
    if (dto.environment !== undefined) data.environment = dto.environment || null;
    if (dto.procedure !== undefined) data.procedure = dto.procedure || null;
    if (dto.result !== undefined) data.result = dto.result || null;
    if (dto.conclusion !== undefined) data.conclusion = dto.conclusion || null;
    if (dto.stack !== undefined) data.stack = dto.stack;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.coverImage !== undefined) data.coverImage = normalizeStoredUrl(dto.coverImage) || null;
    if (dto.gallery !== undefined) data.gallery = dto.gallery;
    if (dto.startedAt !== undefined)
      data.startedAt = dto.startedAt ? new Date(dto.startedAt) : null;
    if (dto.completedAt !== undefined)
      data.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    if (dto.relatedPostId !== undefined) data.relatedPostId = dto.relatedPostId || null;
    if (dto.relatedProjectId !== undefined) data.relatedProjectId = dto.relatedProjectId || null;

    if (dto.content !== undefined || dto.videoUrl !== undefined) {
      const content = dto.content !== undefined ? normalizeStoredContent(dto.content) : null;
      if (content !== null) data.content = content;
      const body =
        content ?? (await this.prisma.labExperiment.findUnique({ where: { id } }))?.content ?? '';
      data.readingTime = readingTimeOf(body);
    }
    if (dto.videoUrl !== undefined) data.videoUrl = normalizeStoredUrl(dto.videoUrl) || null;
    if (dto.videoDuration !== undefined) data.videoDuration = dto.videoDuration ?? null;
    if (dto.chapters !== undefined) data.chapters = parseChapters(dto.chapters);
    if (dto.published !== undefined) data.published = dto.published;

    return this.prisma.labExperiment.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.labExperiment.delete({ where: { id } });
    return { success: true };
  }
}

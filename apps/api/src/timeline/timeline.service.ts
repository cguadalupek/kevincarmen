import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimelineEventDto } from './dto/create-timeline.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline.dto';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async findAllAdmin() {
    return this.prisma.timelineEvent.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findPublished() {
    return this.prisma.timelineEvent.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    const item = await this.prisma.timelineEvent.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Hito de timeline no encontrado');
    return item;
  }

  async create(dto: CreateTimelineEventDto) {
    return this.prisma.timelineEvent.create({
      data: {
        year: dto.year,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? 'PROJECT',
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTimelineEventDto) {
    await this.findById(id);
    const data: Prisma.TimelineEventUpdateInput = {};
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.position !== undefined) data.position = dto.position;
    return this.prisma.timelineEvent.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.timelineEvent.delete({ where: { id } });
    return { success: true };
  }
}
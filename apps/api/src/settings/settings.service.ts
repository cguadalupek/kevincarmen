import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  }

  async findOne(key: string) {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (!row) throw new NotFoundException(`Setting '${key}' no encontrado`);
    return row;
  }

  async upsertMany(dto: UpdateSettingsDto) {
    const entries = Object.entries(dto.settings ?? {});
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return this.findAll();
  }

  async remove(key: string) {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (!row) throw new NotFoundException(`Setting '${key}' no encontrado`);
    await this.prisma.setting.delete({ where: { key } });
    return { success: true };
  }
}
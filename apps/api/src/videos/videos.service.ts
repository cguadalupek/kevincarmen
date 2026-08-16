import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VideoType, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  private normalizeStoredUrl(value?: string | null) {
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

  private detectVideoType(url: string): VideoType {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      if (/youtube\.com\/shorts\//.test(url) || /youtube\.com\/embed\/.*shorts/.test(url)) {
        return VideoType.YOUTUBE_SHORT;
      }
      if (/youtube\.com|youtu\.be/.test(hostname)) return VideoType.YOUTUBE;
      if (/tiktok\.com/.test(hostname)) return VideoType.TIKTOK;
      if (/twitter\.com|x\.com/.test(hostname)) return VideoType.TWITTER;
      if (/vimeo\.com/.test(hostname)) return VideoType.VIMEO;
      if (/odysee\.com|rumble\.com/.test(hostname)) return VideoType.ODYSEE;
      if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return VideoType.GENERIC;
    } catch {
      // ignore
    }
    return VideoType.GENERIC;
  }

  async findAllAdmin() {
    return this.prisma.video.findMany({ orderBy: [{ featured: 'desc' }, { position: 'asc' }, { publishedAt: 'desc' }] });
  }

  async findPublished(limit = 24) {
    return this.prisma.video.findMany({
      orderBy: [{ featured: 'desc' }, { position: 'asc' }, { publishedAt: 'desc' }],
      take: limit,
    });
  }

  async findById(id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video no encontrado');
    return video;
  }

  async create(dto: CreateVideoDto) {
    const videoType = dto.videoType ?? this.detectVideoType(dto.url);
    const isShort = dto.isShort ?? videoType === VideoType.YOUTUBE_SHORT;
    return this.prisma.video.create({
      data: {
        title: dto.title,
        url: this.normalizeStoredUrl(dto.url) ?? dto.url,
        videoType,
        thumbnail: this.normalizeStoredUrl(dto.thumbnail) ?? null,
        description: dto.description ?? null,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        isShort,
        featured: dto.featured ?? false,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateVideoDto) {
    await this.findById(id);
    const data: Prisma.VideoUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.url !== undefined) {
      data.url = this.normalizeStoredUrl(dto.url) ?? dto.url;
      data.videoType = dto.videoType ?? this.detectVideoType(dto.url);
    }
    if (dto.videoType !== undefined) data.videoType = dto.videoType;
    if (dto.thumbnail !== undefined)
      data.thumbnail = this.normalizeStoredUrl(dto.thumbnail) || null;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.publishedAt !== undefined) data.publishedAt = new Date(dto.publishedAt);
    if (dto.isShort !== undefined) data.isShort = dto.isShort;
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.position !== undefined) data.position = dto.position;
    return this.prisma.video.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.video.delete({ where: { id } });
    return { success: true };
  }
}
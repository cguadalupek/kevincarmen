import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join, basename } from 'path';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import {
  CreateResourceTypeDto,
  ReorderResourceTypesDto,
  UpdateResourceTypeDto,
} from './dto/resource-type.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(process.cwd(), '..', 'web', 'public', 'uploads', 'posts');

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  findPublished() {
    return this.resourcesService.findPublished();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.resourcesService.findAllAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.resourcesService.findById(id);
  }

  // ── Tipos de recurso (Recursos › Tipos) ──────────────────────────────────
  // Todas las rutas con nombre fijo van ANTES de `:id` / `:slug`: Nest resuelve
  // por orden y `types` se interpretaría como un id si estuvieran después.

  /** Público: tipos editables (los usa el panel y el filtro de /recursos). */
  @Get('types')
  findTypes() {
    return this.resourcesService.findAllTypes();
  }

  @Put('types/reorder')
  @UseGuards(JwtAuthGuard)
  reorderTypes(@Body() dto: ReorderResourceTypesDto) {
    return this.resourcesService.reorderTypes(dto.typeIds);
  }

  @Post('types')
  @UseGuards(JwtAuthGuard)
  createType(@Body() dto: CreateResourceTypeDto) {
    return this.resourcesService.createType(dto);
  }

  @Put('types/:id')
  @UseGuards(JwtAuthGuard)
  updateType(@Param('id') id: string, @Body() dto: UpdateResourceTypeDto) {
    return this.resourcesService.updateType(id, dto);
  }

  @Delete('types/:id')
  @UseGuards(JwtAuthGuard)
  deleteType(@Param('id') id: string) {
    return this.resourcesService.deleteType(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const resource = await this.resourcesService.findById(id);
    // El borrado del archivo es best-effort (no impide borrar el registro).
    if (resource.fileUrl?.startsWith('/uploads/')) {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(join(UPLOAD_DIR, 'recursos', basename(resource.fileUrl)));
      } catch {
        // archivo ya ausente
      }
    }
    return this.resourcesService.remove(id);
  }

  /**
   * GET /resources/:slug/download — descarga pública.
   * Cuenta la descarga, sirve el archivo almacenado (attachment) o redirige
   * si el recurso es un enlace externo.
   */
  @Get(':slug/download')
  async download(@Param('slug') slug: string, @Res() res: Response) {
    const resource = await this.resourcesService.findBySlug(slug);

    if (resource.fileUrl && /^https?:\/\//i.test(resource.fileUrl)) {
      await this.resourcesService.registerDownload(slug);
      return res.redirect(302, resource.fileUrl);
    }

    if (!resource.fileUrl || !resource.fileUrl.startsWith('/uploads/')) {
      throw new NotFoundException('Este recurso aún no tiene archivo disponible');
    }

    const filePath = join(UPLOAD_DIR, 'recursos', basename(resource.fileUrl));
    if (!existsSync(filePath)) {
      throw new NotFoundException('El archivo ya no está disponible en el servidor');
    }

    await this.resourcesService.registerDownload(slug);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${resource.fileName ?? basename(filePath)}"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return createReadStream(filePath).pipe(res);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.resourcesService.findBySlug(slug);
  }
}

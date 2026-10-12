import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { readFile, unlink } from 'fs/promises';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(process.cwd(), '..', 'web', 'public', 'uploads', 'posts');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Firmas reales (magic bytes) de los formatos permitidos: JPG, PNG, GIF, WebP. */
function isAllowedImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // GIF: GIF87a / GIF89a
  if (buffer.subarray(0, 4).toString('ascii') === 'GIF8') return true;
  // WebP: RIFF .... WEBP
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return true;
  return false;
}

@Controller('media')
export class MediaController {
  constructor(private prisma: PrismaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.png';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Solo se permiten imágenes JPG, PNG, GIF o WebP (intenta con una captura PNG o un JPG).',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    // El mimetype lo declara el cliente y se puede falsear: validamos la firma real
    // del archivo ya guardado y lo borramos si no es una imagen permitida.
    const filePath = join(UPLOAD_DIR, file.filename);
    let header: Buffer;
    try {
      header = await readFile(filePath);
    } catch {
      throw new BadRequestException('No se pudo leer el archivo subido');
    }
    if (!isAllowedImage(header)) {
      await unlink(filePath).catch(() => undefined);
      throw new BadRequestException(
        'El archivo no es una imagen válida: se permiten JPG, PNG, GIF o WebP.',
      );
    }

    const url = `/uploads/posts/${file.filename}`;

    await this.prisma.media.create({
      data: {
        filename: file.filename,
        url,
        mimeType: file.mimetype,
        size: file.size,
        alt: file.originalname,
      },
    });

    return { url, filename: file.filename };
  }
}
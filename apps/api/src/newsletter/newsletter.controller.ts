import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /** Alta desde el sitio. Idempotente por email. */
  @Post()
  subscribe(@Body() dto: CreateNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  /** Baja desde el sitio: reutiliza el DTO de alta (solo se lee `email`). */
  @Post('unsubscribe')
  unsubscribe(@Body() dto: CreateNewsletterDto) {
    return this.newsletterService.unsubscribe(dto.email);
  }

  // Las rutas literales (`admin/all`) se declaran ANTES de `:id`: Nest resuelve
  // por orden de declaración y, si no, `admin` se interpretaría como un id.
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.newsletterService.findAllAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.newsletterService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateNewsletterDto) {
    return this.newsletterService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.newsletterService.remove(id);
  }
}

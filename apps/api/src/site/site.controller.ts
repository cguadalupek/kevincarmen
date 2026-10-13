import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SiteService } from './site.service';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  /** Contenido público del inicio y sobre mí (hero + about). */
  @Get()
  getContent() {
    return this.siteService.getContent();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  update(@Body() dto: UpdateSiteDto) {
    return this.siteService.update(dto);
  }
}
import { Module } from '@nestjs/common';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { TechController } from './tech.controller';
import { TechService } from './tech.service';

@Module({
  controllers: [SiteController, TechController],
  providers: [SiteService, TechService],
})
export class SiteModule {}
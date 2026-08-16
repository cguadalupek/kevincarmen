import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  upsert(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.upsertMany(dto);
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
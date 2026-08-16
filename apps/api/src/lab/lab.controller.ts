import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LabService } from './lab.service';
import { CreateLabServiceDto } from './dto/create-lab-service.dto';
import { UpdateLabServiceDto } from './dto/update-lab-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  findPublished() {
    return this.labService.findPublished();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.labService.findAllAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.labService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateLabServiceDto) {
    return this.labService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateLabServiceDto) {
    return this.labService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.labService.remove(id);
  }
}
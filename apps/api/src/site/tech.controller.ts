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
import { TechService } from './tech.service';
import { CreateTechCategoryDto, UpdateTechCategoryDto } from './dto/tech-category.dto';
import { CreateTechItemDto, UpdateTechItemDto } from './dto/tech-item.dto';
import { ReorderTechDto } from './dto/reorder-tech.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tech')
export class TechController {
  constructor(private readonly techService: TechService) {}

  /** Grid público: categorías con ítems ordenados. */
  @Get()
  listCategories() {
    return this.techService.listCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() dto: CreateTechCategoryDto) {
    return this.techService.createCategory(dto);
  }

  @Put('categories/reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() dto: ReorderTechDto) {
    return this.techService.reorder(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateTechCategoryDto) {
    return this.techService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  removeCategory(@Param('id') id: string) {
    return this.techService.removeCategory(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  createItem(@Body() dto: CreateTechItemDto) {
    return this.techService.createItem(dto);
  }

  @Put('items/reorder')
  @UseGuards(JwtAuthGuard)
  reorderItems(@Body() dto: ReorderTechDto) {
    return this.techService.reorder(dto);
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard)
  updateItem(@Param('id') id: string, @Body() dto: UpdateTechItemDto) {
    return this.techService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  removeItem(@Param('id') id: string) {
    return this.techService.removeItem(id);
  }
}
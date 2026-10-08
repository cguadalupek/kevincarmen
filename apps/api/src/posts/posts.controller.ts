import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CategoriesService } from '../categories/categories.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * GET /posts                                  → publicados
   * GET /posts?category=mi-categoria            → filtra por slug de principal
   * GET /posts?category=infraestructura         → acepta también el slug antiguo
   * GET /posts?subcategory=servidores-homelab   → filtra por slug de subcategoría
   * GET /posts?category=...&subcategory=...     → ambos
   */
  @Get()
  findAll(@Query('category') category?: string, @Query('subcategory') subcategory?: string) {
    return this.postsService.findAllPublished({
      categorySlug: category,
      subCategorySlug: subcategory,
    });
  }

  @Get('videos')
  findLatestVideos(@Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined;
    return this.postsService.findLatestVideos(
      Number.isFinite(parsed) ? Math.min(parsed ?? 6, 24) : 6,
    );
  }

  /**
   * @deprecated Se movió a `GET /categories`. Se mantiene como alias para no
   * romper clientes antiguos; devuelve el mismo árbol.
   */
  @Get('categories')
  findAllCategories() {
    return this.categoriesService.findTree();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.postsService.findAllAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.findBySlug(slug);
    if (!post || post.status !== 'PUBLISHED') {
      throw new NotFoundException('Artículo no encontrado');
    }
    return post;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto, @Request() req: { user: { id: string } }) {
    return this.postsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.postsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.postsService.remove(id, req.user.id);
  }
}

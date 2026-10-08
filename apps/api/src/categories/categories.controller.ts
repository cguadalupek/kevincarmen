import { Controller, Get, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { resolveMainCategoryParam } from './taxonomy';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/v1/categories            → árbol completo (principal + subcategorías)
   * GET /api/v1/categories?tree=false → lista plana de subcategorías
   */
  @Get()
  findAll(@Query('tree') tree?: string, @Query('category') category?: string) {
    if (tree === 'false') {
      return this.categoriesService.findAll(resolveMainCategoryParam(category));
    }

    return this.categoriesService.findTree();
  }
}

import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  // PostsService lo usa para validar que la subcategoría pertenezca a la principal.
  exports: [CategoriesService],
})
export class CategoriesModule {}

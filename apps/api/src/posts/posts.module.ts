import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

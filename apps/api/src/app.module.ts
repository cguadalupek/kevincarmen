import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { VideosModule } from './videos/videos.module';
import { CoursesModule } from './courses/courses.module';
import { LabModule } from './lab/lab.module';
import { SettingsModule } from './settings/settings.module';
import { TimelineModule } from './timeline/timeline.module';
import { SiteModule } from './site/site.module';
import { ProjectsModule } from './projects/projects.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    PostsModule,
    HealthModule,
    MediaModule,
    VideosModule,
    CoursesModule,
    LabModule,
    ResourcesModule,
    SettingsModule,
    TimelineModule,
    SiteModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

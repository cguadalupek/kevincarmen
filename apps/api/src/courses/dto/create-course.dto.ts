import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CourseDifficulty, CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(120)
  slug!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(CourseDifficulty)
  level?: CourseDifficulty;

  @IsString()
  duration!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lessonsCount?: number;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
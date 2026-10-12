import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CourseDifficulty, CourseStatus } from '@prisma/client';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsEnum(CourseDifficulty)
  level?: CourseDifficulty;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lessonsCount?: number;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsString()
  coverImage?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsString()
  targetAudience?: string | null;
}
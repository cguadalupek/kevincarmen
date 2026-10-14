import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() longDescription?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) technologies?: string[];
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() projectCategoryId?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsInt() @Min(1900) projectYear?: number;
  @IsOptional() @IsString() repository?: string;
  @IsOptional() @IsString() demo?: string;
  @IsOptional() @IsString() documentation?: string;
  @IsOptional() @IsString() problem?: string;
  @IsOptional() @IsString() solution?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() architecture?: string;
  @IsOptional() @IsString() architectureImage?: string;
  @IsOptional() @IsArray() technicalDecisions?: { title: string; description: string }[];
  @IsOptional() @IsArray() challenges?: { title: string; problem: string; solution: string }[];
  @IsOptional() @IsString() results?: string;
  @IsOptional() @IsString() learnings?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) gallery?: string[];
  @IsOptional() @IsBoolean() featured?: boolean;
}

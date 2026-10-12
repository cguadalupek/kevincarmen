import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) slug!: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsEnum(ProjectStatus) status!: ProjectStatus;
  @IsString() @IsNotEmpty() coverImage!: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() longDescription?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) technologies?: string[];
  @IsOptional() @IsString() category?: string;
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

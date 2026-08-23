import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString() @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsString() description!: string;
  @IsOptional() @IsString() longDescription?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) technologies?: string[];
  @IsOptional() @IsString() repository?: string;
  @IsOptional() @IsString() demo?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsString() coverImage?: string;
}

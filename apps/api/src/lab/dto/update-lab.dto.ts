import { ExperimentStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLabDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() hypothesis?: string;
  @IsOptional() @IsString() environment?: string;
  @IsOptional() @IsString() procedure?: string;
  @IsOptional() @IsEnum(ExperimentStatus) status?: ExperimentStatus;
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsString() conclusion?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) stack?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) gallery?: string[];
  @IsOptional() @IsDateString() startedAt?: string;
  @IsOptional() @IsDateString() completedAt?: string;
  @IsOptional() @IsString() relatedPostId?: string;
  @IsOptional() @IsString() relatedProjectId?: string;
}

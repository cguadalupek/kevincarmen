import { ExperimentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChapterDto, LabMilestoneDto } from './create-lab.dto';

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

  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsInt() @Min(1) videoDuration?: number;
  @IsOptional() @IsArray() chapters?: ChapterDto[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabMilestoneDto)
  milestones?: LabMilestoneDto[];
  @IsOptional() @IsBoolean() published?: boolean;
}

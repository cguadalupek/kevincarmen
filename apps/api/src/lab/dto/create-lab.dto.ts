import { ExperimentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Capítulo del video: { time: "00:00", title: "..." } */
export class ChapterDto {
  @IsString()
  time!: string;

  @IsString()
  title!: string;
}

export const LAB_MILESTONE_KINDS = ['detail', 'terminal', 'comparison', 'metrics'] as const;
export type LabMilestoneKind = (typeof LAB_MILESTONE_KINDS)[number];

/** Hito de la ficha de laboratorio (timeline): { id, title, summary, kind, content }. */
export class LabMilestoneDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsIn(LAB_MILESTONE_KINDS as unknown as string[]) kind?: LabMilestoneKind;
  @IsOptional() @IsString() content?: string;
}

export class CreateLabDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsString()
  @MaxLength(500)
  description!: string;

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

  /** Cuerpo del experimento en Markdown. */
  @IsOptional() @IsString() content?: string;
  /** Video largo de YouTube (10-20 min) que documenta el experimento. */
  @IsOptional() @IsString() videoUrl?: string;
  /** Duración del video en minutos. */
  @IsOptional() @IsInt() @Min(1) videoDuration?: number;
  /** Capítulos del video. */
  @IsOptional() @IsArray() chapters?: ChapterDto[];
  /** Hitos interactivos de la ficha de laboratorio. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabMilestoneDto)
  milestones?: LabMilestoneDto[];
  /** Borrador / Publicado. */
  @IsOptional() @IsBoolean() published?: boolean;
}

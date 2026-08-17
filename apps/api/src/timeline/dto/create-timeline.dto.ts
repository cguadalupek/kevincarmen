import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { TimelineEventType } from '@prisma/client';

export class CreateTimelineEventDto {
  @IsString()
  @MaxLength(20)
  year!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(TimelineEventType)
  type?: TimelineEventType;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
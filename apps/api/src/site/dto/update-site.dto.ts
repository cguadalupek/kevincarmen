import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HeroDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

class AboutDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bio?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nowTitle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nowItems?: string[];
}

export class UpdateSiteDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HeroDto)
  hero?: HeroDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AboutDto)
  about?: AboutDto;
}
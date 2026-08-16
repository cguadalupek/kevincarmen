import { IsObject, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  settings?: Record<string, string>;
}
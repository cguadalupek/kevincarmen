import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTechCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}

export class UpdateTechCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;
}
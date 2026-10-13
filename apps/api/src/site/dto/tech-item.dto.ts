import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTechItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}

export class UpdateTechItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;
}
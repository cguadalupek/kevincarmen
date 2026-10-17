import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/** Alta en la newsletter (endpoint público). */
export class CreateNewsletterDto {
  @IsEmail({}, { message: 'Introduce un email válido.' })
  @MaxLength(254, { message: 'El email es demasiado largo.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  name?: string;
}

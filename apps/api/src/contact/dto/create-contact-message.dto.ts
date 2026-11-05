import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Mensaje del formulario público de contacto (`POST /contact`).
 * Los límites coinciden con lo que Telegram acepta en un `sendMessage` (4096 caracteres).
 */
export class CreateContactMessageDto {
  @IsString({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  name!: string;

  @IsEmail({}, { message: 'Introduce un email válido.' })
  @MaxLength(254, { message: 'El email es demasiado largo.' })
  email!: string;

  @IsString({ message: 'El mensaje es obligatorio.' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres.' })
  @MaxLength(4000, { message: 'El mensaje es demasiado largo (máximo 4000 caracteres).' })
  message!: string;
}

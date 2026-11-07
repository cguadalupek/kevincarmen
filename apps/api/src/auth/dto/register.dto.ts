import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Alta de una cuenta de estudiante (pública, desde `/cuenta/registro`). */
export class RegisterDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede superar los 80 caracteres' })
  name!: string;
}

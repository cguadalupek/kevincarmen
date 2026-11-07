import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Autenticación. `login` sirve tanto al panel como a los estudiantes; `register`
 * es el alta pública de estudiantes (`/cuenta/registro`).
 *
 * El throttler (registrado en `AppModule`) frena la fuerza bruta: 10 intentos de
 * acceso y 5 altas por minuto e IP.
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}

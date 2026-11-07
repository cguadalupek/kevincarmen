import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

/**
 * `ThrottlerModule` se importa SIN `forRoot`: la configuración global vive en
 * `AppModule` y este import solo hace visibles sus providers al `ThrottlerGuard`
 * del controlador (mismo patrón que `ContactModule` y `LikesModule`).
 */
@Module({
  imports: [
    PassportModule,
    ThrottlerModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

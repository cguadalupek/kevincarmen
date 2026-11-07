import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { RequestUser } from './jwt-auth.guard';

/**
 * Guard de SESIÓN: acepta cualquier token válido, incluido el de un estudiante.
 *
 * Es el que usan los endpoints de progreso (`/progress/*`), porque el dueño de los
 * datos es el propio alumno y no necesita permisos de panel. No confundir con
 * `JwtAuthGuard`, que además exige un rol con acceso al CMS.
 */
@Injectable()
export class SessionAuthGuard extends AuthGuard('jwt') {
  handleRequest<T extends RequestUser>(err: Error | null, user: T): T {
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado');
    }
    return user;
  }
}

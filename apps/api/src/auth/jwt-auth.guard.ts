import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { STUDENT_ROLE } from './roles';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Guard del PANEL (CMS). Exige un token válido **y** un rol distinto de `student`.
 *
 * Antes de existir el registro de estudiantes la autorización era binaria («hay
 * token o no»). Con cuentas públicas en la misma tabla `users`, un token de
 * estudiante habría entrado a cualquier endpoint de escritura del panel, así que
 * el rechazo vive aquí: todos los controladores del CMS ya usan este guard, de modo
 * que un solo cambio cierra el acceso en todos ellos.
 *
 * Los endpoints que SÍ deben aceptar estudiantes (progreso de cursos) usan
 * `SessionAuthGuard`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T extends RequestUser>(err: Error | null, user: T): T {
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado');
    }
    if (user.role === STUDENT_ROLE) {
      throw new ForbiddenException('Esta cuenta no tiene acceso al panel');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

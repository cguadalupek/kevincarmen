import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from './jwt-auth.guard';

/**
 * Usuario del token (lo inyecta `JwtStrategy.validate`).
 *
 * Evita leer `req.user` a mano en cada controlador; funciona igual con
 * `JwtAuthGuard` y con `SessionAuthGuard`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);

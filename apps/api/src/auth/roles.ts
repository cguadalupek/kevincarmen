/**
 * Nombre del rol de los estudiantes (usuarios públicos que sincronizan progreso).
 *
 * El panel del CMS autoriza de forma binaria (`JwtAuthGuard`), así que este rol es
 * el que distingue una cuenta de alumno de una cuenta con acceso al panel: ver
 * `jwt-auth.guard.ts`. Se crea sola al primer registro (`AuthService.register`),
 * no hace falta sembrarla.
 */
export const STUDENT_ROLE = 'student';

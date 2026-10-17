# Soluciones a Bugs Complejos

### [2026-10-16] Error 400 en peticiones PUT/PATCH del CMS
- **Síntoma:** Peticiones de edición de artículos o categorías fallaban con HTTP 400 (`property X should not exist`).
- **Causa:** El `UpdateXDto` estaba definido como un `type` alias en lugar de una `class`, perdiendo la metadata de validación del `ValidationPipe` con `forbidNonWhitelisted`.
- **Solución:** Convertir todos los DTOs de edición a clases de TypeScript decoradas con `class-validator`.
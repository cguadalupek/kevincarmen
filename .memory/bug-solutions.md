# Soluciones a Bugs Complejos

### [2026-10-16] Error 400 en peticiones PUT/PATCH del CMS
- **Síntoma:** Peticiones de edición de artículos o categorías fallaban con HTTP 400 (`property X should not exist`).
- **Causa:** El `UpdateXDto` estaba definido como un `type` alias en lugar de una `class`, perdiendo la metadata de validación del `ValidationPipe` con `forbidNonWhitelisted`.
- **Solución:** Convertir todos los DTOs de edición a clases de TypeScript decoradas con `class-validator`.

### [2026-10-17] `pnpm dev`: la web devolvía 000/500 en cualquier página (Node 24)
- **Síntoma:** `next dev` arrancaba bien (`✓ Ready`), pero `GET /` y `GET /blog` no devolvían respuesta (curl 000; en el navegador, 500). `next build` pasaba sin errores. En `web.log`: `ReferenceError: require is not defined` en `apps/web/tailwind.config.ts:72`.
- **Causa:** El config de Tailwind se carga como ESM con Node ≥ 22/24 y la línea de `plugins` usaba `require('@tailwindcss/typography')`. En `next build` el config se resuelve con otro loader (jiti), por eso el build nunca lo destapó.
- **Solución:** `import typography from '@tailwindcss/typography'` al principio del archivo y `plugins: [typography]`. Verificado con `pnpm --filter @kevincarmen/web build` en verde y con `next dev` sirviendo `/blog` (200) con contenido de la BD.

### [2026-10-17] `pnpm dev` no arranca la API: `DATABASE_URL` no encontrado
- **Síntoma:** La API moría en `PrismaService.onModuleInit` con `PrismaClientInitializationError ... Environment variable not found: DATABASE_URL` (P1012) aun teniendo `.env` (y luego `.env.local`) en la raíz del monorepo.
- **Causa:** dos capas. (1) La API no usa `@nestjs/config` ni `dotenv`: solo lee `process.env`, y Turborepo **no** inyecta los archivos `.env*` en las tareas. (2) Con `pnpm dev` (que va por Turborepo), el **modo estricto de Turbo 2 descarta toda variable del entorno que no esté declarada** en `turbo.json`: aun exportando `DATABASE_URL` en la shell, la tarea de la API la recibía vacía. Con `pnpm --filter @kevincarmen/api dev` (sin turbo) sí llegaba, que es lo que despistó al principio.
- **Solución:** exportar antes de arrancar (`set -a; . ./.env.local; set +a; pnpm dev`) **y** declarar los `passThroughEnv` de la tarea `dev` en `turbo.json` (DATABASE_URL, REDIS_URL, JWT_SECRET, REVALIDATE_SECRET, ALLOWED_ORIGINS, PUBLIC_SITE_HOSTS, PORT, UPLOAD_DIR, API_INTERNAL_URL, API_PROXY_TARGET, NEXT_PUBLIC_API_URL).
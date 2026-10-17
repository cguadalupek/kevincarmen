# Tareas Activas y Progreso Actual

## En Progreso
- [x] Configuración de `README.md` y `AGENTS.md` en la raíz del monorepo.
- [x] Sincronización de repositorio de GitHub (`cguadalupek/kevincarmen`) y purga de credenciales con `git-filter-repo`.
- [x] Implementación de Skills para el flujo de Vibe Coding (`memory`, `deploy-check`) — instaladas en el entorno del agente (`skills/software-development/`), no versionadas en el repo.
- [x] Versionar `.memory/active-tasks.md` y `.memory/bug-solutions.md` (commit `d636f8a`): antes solo existían en el host de despliegue.
- [x] Componente `BlogStatsCard` en `apps/web/src/components/blog/blog-stats-card.tsx` (commit `de74413`, desplegado en `9c28f5d`): Server Component de resumen del blog con datos reales de la API (9 artículos publicados, 4 min de lectura media, 5 categorías / 13 subcategorías). Sin métrica de vistas: el sistema no registra visitas (`Post` no tiene contador). Aún no se renderiza en ninguna página (decisión explícita).
- [x] Módulo backend `newsletter` (commit `cabb87a`): modelo `NewsletterSubscriber` + migración `20261017030000` aplicada en producción (`_prisma_migrations` = 21 filas, `steps=1`), seis endpoints (alta/baja públicas, listado y CRUD con JWT). Verificado con 27 comprobaciones HTTP en sandbox (Postgres desechable restaurado de un dump real) y con el circuito real por nginx tras el deploy; la fila de prueba se eliminó y la tabla quedó en 0 filas.

## Siguientes Pasos
- [x] Probar el flujo completo de desarrollo local (`pnpm dev`): validado el 2026-10-17 — web :3000 y api :4001 arriba, api `/api/v1/health` 200 y `/api/v1/posts` devolviendo los 9 posts de la BD del 108, web `/blog` 200 (138 KB) renderizando títulos reales. Receta: `set -a; . ./.env.local; set +a; pnpm dev` (con el túnel al Postgres del 108 y sin el reenvío de puertos de Cursor ocupando 3000/4001).
- [x] Validar builds individuales de `apps/web` y `apps/api` (2026-10-17 UTC: ambos exit 0; la web compila, genera las 34 páginas y regenera `BUILD_ID`).
- [ ] Dar uso a lo que ya está desplegado: montar `BlogStatsCard` en una página (cabecera de `/blog` o dashboard del panel) y añadir el formulario público de suscripción + la sección de suscriptores en el panel (los endpoints ya están en producción, sin UI todavía).
- [ ] Arreglar el lint del API: `pnpm --filter @kevincarmen/api lint` falla (exit 2) desde antes de estos cambios — ESLint 9 exige `eslint.config.js` y el repo solo tiene `apps/web/.eslintrc.json`, que no es alcanzable desde `apps/api/src`.
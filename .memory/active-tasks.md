# Tareas Activas y Progreso Actual

## En Progreso
- [x] Configuración de `README.md` y `AGENTS.md` en la raíz del monorepo.
- [x] Sincronización de repositorio de GitHub (`cguadalupek/kevincarmen`) y purga de credenciales con `git-filter-repo`.
- [x] Implementación de Skills para el flujo de Vibe Coding (`memory`, `deploy-check`) — instaladas en el entorno del agente (`skills/software-development/`), no versionadas en el repo.
- [x] Versionar `.memory/active-tasks.md` y `.memory/bug-solutions.md` (commit `d636f8a`): antes solo existían en el host de despliegue.

## Siguientes Pasos
- [x] Probar el flujo completo de desarrollo local (`pnpm dev`): validado el 2026-10-17 — web :3000 y api :4001 arriba, api `/api/v1/health` 200 y `/api/v1/posts` devolviendo los 9 posts de la BD del 108, web `/blog` 200 (138 KB) renderizando títulos reales. Receta: `set -a; . ./.env.local; set +a; pnpm dev` (con el túnel al Postgres del 108 y sin el reenvío de puertos de Cursor ocupando 3000/4001).
- [x] Validar builds individuales de `apps/web` y `apps/api` (2026-10-17 UTC: ambos exit 0; la web compila, genera las 34 páginas y regenera `BUILD_ID`).
# Tareas Activas y Progreso Actual

## En Progreso
- [x] Configuración de `README.md` y `AGENTS.md` en la raíz del monorepo.
- [x] Sincronización de repositorio de GitHub (`cguadalupek/kevincarmen`) y purga de credenciales con `git-filter-repo`.
- [x] Implementación de Skills para el flujo de Vibe Coding (`memory`, `deploy-check`) — instaladas en el entorno del agente (`skills/software-development/`), no versionadas en el repo.
- [x] Versionar `.memory/active-tasks.md` y `.memory/bug-solutions.md` (commit `d636f8a`): antes solo existían en el host de despliegue.

## Siguientes Pasos
- [ ] Probar el flujo completo de desarrollo local (`pnpm dev`): nunca se ha ejecutado en este entorno.
- [x] Validar builds individuales de `apps/web` y `apps/api` (2026-10-17 UTC: ambos exit 0; la web compila, genera las 34 páginas y regenera `BUILD_ID`).
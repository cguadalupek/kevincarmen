# Registro de decisiones — kevincarmen

Bitácora de cambios estructurales (esquema, despliegue, skills de trabajo) con el *porqué*,
no solo el *qué*. Fechas en UTC (el reloj de producción). Añade una entrada por cambio, no
reatribuyas entradas antiguas.

---

## 2026-10-17 · `Project.readingTime` (migración `20261017010000_add_reading_time_to_projects`)

Prueba de la capacidad `prisma-migration` con la skill `nestjs-prisma-migrations`.

- `Project.readingTime Int? @map("reading_time")` → columna `projects.reading_time INTEGER`
  nullable. Los 19 proyectos existentes quedan en `NULL`; la web puede calcular el valor.
- Tipo espejo en `apps/web/src/lib/api/projects.ts` (`PublicProject.readingTime`), porque el API
  devuelve todos los escalares del modelo y el tipo declarado no debía quedarse corto.
- Verificado en tres capas antes de tocar producción: transacción + `ROLLBACK` sobre la BD real,
  `migrate deploy` sobre un Postgres descartable restaurado de un dump de prod (idempotente en la
  segunda pasada) y el deploy real (hook `post-receive` → `prisma migrate deploy` al arrancar).
- Hallazgo: `/db-migrate "añadir columna isFeatured a posts"` es un no-op — `posts.featured`
  existe desde `202608230200_add_featured_to_posts`. La skill debe comprobar el modelo antes de
  generar SQL.

## 2026-10-17 · Reconciliación de `schema.prisma` con la BD de producción (commit `chore(schema)`)

Al validar la migración anterior, `prisma migrate diff` contra la BD real destapó **drift
pre-existente** de 4 diferencias ajenas a ese cambio. Se resuelven ahora en un commit aparte.

| Drift (BD → schema) | Causa | Decisión |
|---|---|---|
| `DROP INDEX "posts_featured_idx"` | índice creado por la migración `202608230200` y nunca declarado en el modelo | **schema**: `@@index([featured])` en `Post` (el nombre que genera Prisma coincide exactamente) |
| `lab_services.name` `DROP NOT NULL` | la columna es legacy (`name` duplica `title`) y el modelo seguía declarándola opcional | **schema**: `name String` (obligatoria). El único `create` de `labExperiment` ya envía `name: dto.title`; las 10 filas tienen valor |
| `lab_services.tags/gallery` `DROP DEFAULT` | la BD tiene `DEFAULT ARRAY[]::text[]` que el modelo no declaraba | **schema**: `@default([])` |
| `projects.tags/gallery` `DROP DEFAULT` | idem | **schema**: `@default([])` |

**Regla aplicada**: cuando el drift es "la BD hace más de lo que declara el schema" y eso ya está
en producción sin romper nada, se corrige el **schema**, no la BD. Resultado: cero SQL nuevo, cero
migraciones, cero cambios de datos, ningún riesgo en el deploy. La alternativa (migración que
afloje la BD: `DROP NOT NULL`, `DROP DEFAULT`) habría empeorado el modelo para igualar una
situación accidental.

**Verificación** (la que define "sincronizado"): con el nuevo `schema.prisma` dentro del contenedor,

```bash
docker exec -w /app/apps/api kevincarmen-api ./node_modules/.bin/prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma --to-schema-datamodel /tmp/schema.sync.prisma --script
# -> "-- This is an empty migration."
```

Más `prisma validate` y `pnpm --filter @kevincarmen/api build` en verde. A partir de aquí, cualquier
`migrate dev` local genera migraciones solo para cambios intencionados.

**Nota para el futuro**: los `String[]` de `projects.technologies` y `lab_services.stack` son
nullable en la BD aunque el schema los declare obligatorios, y Prisma no lo reporta como drift.
No "arreglarlo" a ciegas sin comprobar los datos.

## 2026-10-17 · Skills de trabajo actualizadas

- **`nestjs-prisma-migrations`**
  - Chequeo barato antes del throwaway: `migrate diff --from-schema-datasource` contra la BD real
    (tu columna debe salir literal; el resto es drift ajeno) y la lista de drift conocido de este
    repo, para no confundirlo con un fallo propio.
  - Recipe completo de `migrate deploy` sobre un Postgres descartable lanzado **desde el propio
    contenedor api** (red compose, CLI y `node_modules` del stack), con las dos trampas de rutas.
  - `prisma validate` en el clon local falla (`P1012 Environment variable not found`) porque no hay
    `.env`: pasar un `DATABASE_URL` de mentira. `prisma generate` no lo necesita.
- **`plink-ssh-deploy`**
  - Paso de `migrate deploy` en el throwaway reescrito con el CLI del contenedor y `--schema`
    absoluto: `-w` se resuelve contra el WORKDIR de la imagen (`/app/apps/api`), así que un `-w`
    dentro de `/tmp` rompe con "no such file or directory".
  - El throwaway se une a la red del stack (`--network <stack>_default`), sin publicar puertos.

## 2026-10-17 · Archivos de memoria versionados en el repo

`active-tasks.md` y `bug-solutions.md` vivían **solo** en `/var/www/kevincarmen/.memory/` del host
de despliegue: no estaban trackeados en git ni existían en el clon local, así que un checkout
limpio o un fallo del host los habría perdido sin copia. Se incorporan al repo, byte a byte
idénticos a producción (verificado con `sha256sum` en ambos lados).

**Regla a partir de ahora**: los tres archivos de `.memory/` se editan en el repo y llegan al
servidor por el hook `post-receive`; no se editan a mano en producción.

## 2026-10-17 · Entorno de desarrollo local contra la BD del 108

Objetivo: `pnpm dev` local (web :3000 + api :4001) contra la base de datos real. El primer intento
de crear una base `kevincarmen_dev` en el Postgres de producción se **canceló** a petición del
usuario (se eliminó con `DROP DATABASE`; el host quedó solo con `kevincarmen`) y se pasó a usar la
base de producción a través de un túnel SSH.

Configuración que queda en la máquina de desarrollo (todo gitignored):

- `.env.local` en la raíz del monorepo (borrado el `.env` que había, para no tener dos fuentes):
  `DATABASE_URL=postgresql://kevincarmen:…@127.0.0.1:55432/kevincarmen`.
- Túnel necesario porque el Postgres de producción solo escucha en `127.0.0.1` dentro del host:
  `plink -batch -pw … -L 55432:127.0.0.1:5432 root@192.168.1.108 -N`.
- **Ojo**: es la base de producción; lo que escriba el dev se escribe de verdad.

**Receta verificada**:

```bash
set -a; . ./.env.local; set +a; pnpm dev
```

El `set -a; . ./.env.local` es obligatorio (ver bug-solutions): la API solo lee `process.env` y
Turborepo no inyecta los `.env*` en las tareas. Además, `turbo.json` declara ahora los
`passThroughEnv` de `dev`, porque el modo estricto de Turbo 2 descarta las variables exportadas
que no estén declaradas — sin eso, `pnpm dev` arranca la web pero la API muere con P1012.

Tres obstáculos encontrados y resueltos:

1. **Los puertos 3000/4001 y 5432 de la máquina de desarrollo los tiene el reenvío de puertos de
   Cursor (Remote-SSH al 108)**. Mientras estén ocupados, `pnpm dev` canónico no puede bindear: el
   API muere con `EADDRINUSE`. Solución: parar ese reenvío en Cursor (pestaña Ports).
2. **`apps/web/tailwind.config.ts` usaba `require()`** en un config que Node 24 carga como ESM:
   `ReferenceError: require is not defined` y todas las páginas devolvían 000/500, mientras
   `next build` seguía pasando. Corregido a `import`.
3. Docker Desktop se usó un momento y se apagó después; los contenedores `kevincarmen-postgres` /
   `-redis` que aparecieron al encenderlo **no son de este repo**: pertenecen al compose viejo de
   `C:\proyectos\web_kevin_carmen` (proyecto `web_kevin_carmen`, su propio volumen) y ocupan
   `0.0.0.0:5432`. No confundirlos con un Postgres de este proyecto.

**Verificación final** (con la base de producción y sin Docker local): `pnpm dev` → web `:3000`
(`✓ Ready in 2.4s`) y API `:4001` (`API listening on port 4001`); `/api/v1/health` 200;
`/api/v1/posts` con los 9 posts reales; `/blog` 200 con títulos de la BD.

## 2026-10-17 · Skills `memory` y `deploy-check` + builds locales verificados

- Skills instaladas en el entorno del agente (`skills/software-development/`), **no** en el repo:
  - `memory`: qué archivo de `.memory/` se toca y cuándo, cómo marcar una tarea solo con evidencia
    y cómo comprobar que producción y el repo coinciden (`sha256sum` del blob contra prod, no del
    working copy con CRLF).
  - `deploy-check`: pre-push (builds, árbol limpio, escaneo de secretos, migración commiteada),
    push y post-deploy obligatorio (SHA del bare repo, contenedores, 200s, drift del árbol).
- Hallazgo que justifica media skill: `git push` a secas desde Windows **se cuelga** en el prompt
  de contraseña del `ssh` de MSYS y el tool muere por timeout; con
  `GIT_SSH_COMMAND='plink -ssh -pw … -batch' git push origin master` tarda ~4 min y sale limpio.
- Verificación de builds locales (2026-10-17 UTC): `pnpm --filter @kevincarmen/api build` y
  `pnpm --filter @kevincarmen/web build`, ambos **exit 0** capturando el código sin tubería (`$?`
  tras un pipe es el de `tail`). La web termina con la tabla de rutas y `BUILD_ID` nuevo; los
  únicos mensajes son 4 avisos `@next/next/no-img-element` en el CMS.
- Deploy del commit `d636f8a` a `origin` (docs: hace falta rebuild igualmente, ~4 min): bare repo
  en `d636f8a`, `git status --untracked-files=no` vacío, `kevincarmen-api`/`-web` recreados y
  `api:200` / `nginx:200`.

## 2026-10-17 · Componente `BlogStatsCard` (skill `component-gen` del repo)

Primer uso de la skill **`.agent/skills/component-gen.md`**, que vive **solo en el árbol desplegado**
(`/var/www/kevincarmen/.agent/skills/`): no está en git ni en un checkout limpio, así que hay que
leerla del servidor. Sus reglas se aplicaron tal cual: Server Component sin `'use client'`, tokens
semánticos del tema, `cn()` de `@kevincarmen/utils`, mobile-first con `min-h-[44px]` y datos vía
`src/lib/api/`.

- Nuevo `apps/web/src/components/blog/blog-stats-card.tsx`: Server Component `BlogStatsCard`
  (archivo kebab-case, como el resto de `components/blog/`). Mide artículos publicados
  (`getPublishedPosts`), lectura media (`readingTime`) y categorías/subcategorías (`getCategoryTree`),
  los mismos fetches con `cache: 'no-store'` que usa `/blog`.
- **Decisión: no se muestra "vistas"**. El sistema no registra visitas: `Post` no tiene contador, no
  hay modelo de analítica ni endpoint de estadísticas. Se prefiere no pintar la métrica antes que
  inventar un 0 que parezca real; la ausencia queda documentada en un comentario del propio
  componente, para añadirla cuando exista el contador de verdad.
- Bordes resueltos en el componente: si el API no responde (posts y árbol vacíos) devuelve `null` en
  vez de una tarjeta con ceros; si ningún artículo tiene `readingTime`, la métrica de lectura se
  omite sola. Nunca valores de relleno.
- El componente **no se renderiza todavía en ninguna página** (decisión explícita): entra al repo
  listo para usarse desde `/blog` o el panel.
- Nota: la skill del agente `kevincarmen-web` (en Windows, fuera del repo) se actualizó con los
  hallazgos de esta tarea — las skills del agente no se versionan en este repo.

**Verificación** (sin `next build` local: hay un `next dev` sirviendo `:3000` por el reenvío de
Cursor y el build reescribe `.next`):

```bash
pnpm --filter @kevincarmen/web exec tsc --noEmit -p tsconfig.json          # exit 0
ESLINT_USE_FLAT_CONFIG=false ./node_modules/.bin/eslint <archivo>          # exit 0 (ESLint 9 sin eslint.config.js)
./node_modules/.bin/prettier --check <archivo>                             # limpio
```

- Render aislado del componente REAL (`typescript.transpileModule` + stubs de `@/lib/api/*` vía
  `Module._load` + `renderToStaticMarkup`) con los datos de producción: `9 publicados · 4 min por
  artículo · 5 categorías / 13 subcategorías`. Con `posts=[]` y árbol `[]` → no renderiza nada; con
  `readingTime=0` en todos los artículos → sin métrica de lectura. `className` del consumidor se
  fusiona con `cn()`.
- El gate de build lo cubre el `docker build` del propio deploy (la imagen compila la web con
  typecheck): si el componente no compilara, el contenedor no se recrearía y el push fallaría.

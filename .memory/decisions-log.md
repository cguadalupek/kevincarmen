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

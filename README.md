# kevincarmen.xyz — Documentación del proyecto

> **Monorepo** (Turborepo) de la plataforma personal **Kevincarmen.xyz**.
> Blog, CMS, portfolio, cursos y laboratorio. Frontend en Next.js + API en NestJS + Prisma/PostgreSQL.

> Este archivo se llamaba `PROYECTO.md`; se renombró a `README.md` para que sea el
> documento de entrada del repositorio.

---

## 1. Resumen

| | |
|---|---|
| **Frontend** | `apps/web` — Next.js 15 (App Router), React 19, Tailwind CSS 3, TipTap 3 |
| **Backend** | `apps/api` — NestJS 10, Prisma 6, class-validator, passport-jwt |
| **Base de datos** | PostgreSQL 16 (+ Redis 7 provisionado, **sin uso** en código) |
| **Monorepo** | Turborepo 2 + pnpm 9.15, Node ≥ 20 |
| **Despliegue** | LXC 108 (Proxmox) + Docker Compose + Cloudflare Tunnel |
| **Dominio** | `kevincarmen.xyz` (sitio público) y `/admin` (CMS) en español |

---

## 2. Estructura del monorepo

```
kevincarmen/
├── apps/
│   ├── web/        Next.js 15 · sitio público + CMS /admin (código en src/)
│   ├── api/        NestJS · API REST (prefijo /api/v1) + Prisma
│   └── cms/        (huérfano: solo package.json, no se usa)
├── packages/
│   ├── config/     @kevincarmen/config    · siteConfig (identidad, nav, social)
│   ├── types/      @kevincarmen/types     · tipos TS (desincronizado, ver §9)
│   └── utils/      @kevincarmen/utils     · cn, slugify, formatDate, calculateReadingTime, truncate
├── docker-compose.yml   · postgres, redis, api, web, nginx
├── nginx/nginx.conf     · reverse proxy (/, /api/v1/, /uploads/posts/)
├── deploy/install-docker.sh
├── tools/seed-course/linux-course.py   · fuente del curso semilla
├── archify/             · diagrama de arquitectura (HTML + JSON)
└── turbo.json, pnpm-workspace.yaml
```

Comandos raíz: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format` (prettier).

`turbo.json`: `build` (con `dependsOn: ^build`, salidas `.next/**` y `dist/**`),
`dev` (`cache: false`, persistente) y `lint` (depende de `^build`).

---

## 3. Arquitectura de runtime

```
Visitantes ──HTTPS──▶ Cloudflare Edge (túnel) ──▶ nginx:80
                                                   ├── /              → Web :3000 (Next SSR)
                                                   ├── /api/v1        → API :4001 (NestJS)
                                                   └── /uploads/posts → volumen de subidas
Web ──API_INTERNAL_URL──▶ API ──▶ PostgreSQL :5432
```

- **Web** renderiza en servidor (App Router) y llama a la API por `API_INTERNAL_URL`
  (dentro de la red Docker: `http://api:4001/api/v1`). En el navegador usa la ruta
  relativa `/api/v1` a través de nginx.
- **nginx** sirve el sitio, proxya `/api/v1/*` y los estáticos de `/uploads/posts/*`.
- **API** expone REST bajo `/api/v1` (helmet + CORS + `ValidationPipe` global).
- **PostgreSQL** guarda todo el contenido. **Redis** está levantado en el compose pero
  **ningún módulo lo consume** todavía (ver §9).
- **Subidas**: `POST /media/upload` (imágenes) escribe en `UPLOAD_DIR` con nombre UUID;
  `POST /media/upload-file` (archivos genéricos) escribe en `UPLOAD_DIR/recursos`.
  El API y nginx comparten el bind mount `/mnt/media/uploads`.

### Infraestructura real (servidor)

- **LXC 108** `kevincarmen` sobre **Proxmox VE** (Debian 12, 4 GB RAM + 512 MB swap, 20 GB disco).
- **Docker Compose** con 5 servicios desde el worktree **`/var/www/kevincarmen`**.
- **Cloudflare Tunnel** (`cloudflared`, servicio systemd del host) expone el sitio sin IP pública.
- **Git bare** en **`/srv/git/kevincarmen.git`** + hook `post-receive` (ver §4).
- **Subidas** en `/mnt/media/uploads` (dispositivo loop de 98 GB, ~38 MB en uso).
- **Backup**: `kevincarmen-backup.timer` (03:30, dump de la BD al SSD + tar de subidas a `/mnt/media/backups`).
- Todos los puertos del compose están publicados en **`127.0.0.1`** (solo nginx:80 y la API salen por el túnel).

---

## 4. Despliegue (cómo llegan los cambios a producción)

1. Se hace `git push` a `root@192.168.1.108:/srv/git/kevincarmen.git` (repo *bare*).
2. El hook **post-receive** hace:
   ```sh
   GIT_WORK_TREE=/var/www/kevincarmen git checkout -f

   cd /var/www/kevincarmen
   docker compose up -d --build
   ```
3. En el arranque, el contenedor `api` ejecuta:
   ```sh
   prisma migrate deploy && node dist/main.js
   ```
   → **las migraciones se aplican solas** al recrear el contenedor.

> ⚠️ Pushear a `master` = desplegar a producción (`docker compose up -d --build`).
> Las features se trabajan en ramas y se fusionan a `master` para desplegar.

**Deploy de un cambio que no requiere rebuild** (p. ej. solo documentación):
desactivar el hook (`chmod -x .../hooks/post-receive`), pushear, reactivarlo y ejecutar
`GIT_WORK_TREE=/var/www/kevincarmen git checkout -f` a mano. Si el checkout se queja de
un archivo sin seguimiento (`untracked working tree files would be overwritten`), hay que
eliminar ese archivo del servidor antes de forzar el checkout.

---

## 5. Modelo de datos (Prisma → PostgreSQL)

Las migraciones viven en `apps/api/prisma/migrations/` y se aplican en orden lexicográfico
(19 migraciones + `migration_lock.toml`). Las más recientes:

| Migración | Qué añade |
|---|---|
| `20261008000627_add_main_and_subcategories` | Taxonomía de dos niveles inicial |
| `20261008120000_main_categories_editable` | `main_categories` como tabla + trigger |
| `20261008130000_add_color_to_main_categories` | `color` (paleta del frontend) |
| `20261012000000_add_course_curriculum` | `course_modules`, `lessons` |
| `20261012010000_seed_linux_course` | Curso semilla "Linux para novatos" |
| `20261012060000_add_project_content` | `content` (Markdown) en proyectos |
| `20261013000000_lab_content_video_resources` | `content`, video y capítulos del lab |
| `20261014000000_add_tech_categories_and_site_content` | `tech_categories`, `tech_items` |
| `20261015000000_normalize_category_positions` | Backfill de `position` |
| `20261015010000_add_project_categories_and_order` | `project_categories` + orden |
| `20261016000000_add_resource_types` | `resource_types` + vínculo en `resources` |
| `20261017000000_add_lab_milestones` | `milestones` (JSONB) del lab |
| `20261017010000_add_reading_time_to_projects` | `reading_time` (minutos, opcional) en proyectos |

**Usuarios y seguridad**: `User`, `Role`, `Permission`.

**Blog / contenido**:
- `Post` — título, slug, excerpt, content (Markdown), portada, video, enlaces externos,
  estado (`DRAFT/PUBLISHED/SCHEDULED/TRASHED`), `featured`, tiempo de lectura, autor, fechas.
  Clasificación obligatoria: `mainCategoryId` + `subCategoryId?`.
- `Tag`, `PostTag` — etiquetas (N:M).
- `Page`, `Comment` — declarados en el esquema pero **sin módulo en la API** (§9).

**Taxonomía (nivel 1 y 2)**:
- `MainCategory` (`main_categories`) — **tabla editable desde el CMS** (no enum):
  `slug`, `name`, `description`, `position`, `color` (clave de paleta).
- `Subcategory` (`subcategories`) — cuelga de una principal (`mainCategoryId`),
  `(mainCategoryId, slug)` único.
- Un **trigger de Postgres** (`enforce_post_subcategory_parent`) impide asignar a un post
  una subcategoría de otra categoría principal.
- Filtro público: `?category=<slug>` (o slug antiguo) y `?subcategory=<slug>`.

**Portfolio y multiformato**:
- `Project` (`projects`) — `content` (Markdown), `technologies[]`, `tags[]`, `gallery[]`,
  `technicalDecisions`/`challenges` (JSON), `status`, `projectYear`, `position`,
  `readingTime` (minutos, opcional/nullable),
  y clasificación editable `projectCategoryId` (+ `category` denormalizado).
- `ProjectCategory` (`project_categories`) — clasificaciones editables
  (`/admin/projects/clasificacion`), con `position` en múltiplos de 10.
- `Video` — `videoType` (YouTube/Short/TikTok/Twitter/Vimeo/Odysee/Generic), `featured`, `position`.
- `Course` + `CourseModule` + `Lesson` — curriculum (ver abajo).
- `LabExperiment` (`lab_services`) — `objective`, `hypothesis`, `environment`, `procedure`,
  `result`, `conclusion`, `stack[]`, `tags[]`, `gallery[]`, `content` (Markdown),
  `videoUrl` + `videoDuration` + `chapters` (JSON), **`milestones` (JSON)** para la ficha
  interactiva (timeline), `published` (solo los publicados salen en `/lab`), `readingTime`.
  Conserva columnas legado (`name`, `icon`, `url`) que ya no expone la API.
- `Resource` (`resources`) — descargables: `fileUrl`/`fileName`/`fileSize`/`version`,
  `tags[]`, `published`, `featured`, `position`, contador `downloads`, y tipo editable
  `resourceTypeId` (el enum `LegacyResourceType`, mapeado a `ResourceType` en la BD,
  se mantiene como respaldo denormalizado de los recursos antiguos).
- `ResourceType` (`resource_types`) — tipos editables (`/admin/recursos/tipos`) con
  `icon` (clave de `RESOURCE_ICONS` en la web) y `position` (múltiplos de 10).

**Cursos con curriculum (módulos + clases)**:
- `Course` — `title`, `slug`, `description`, `subtitle`, `level`
  (BEGINNER/INTERMEDIATE/ADVANCED), `duration`, `lessonsCount`, `status`, `coverImage`,
  `position`, `learningPoints[]`, `requirements[]`, `targetAudience`.
- `CourseModule` (`course_modules`) — agrupa clases; cuelga del curso con `onDelete: Cascade`.
- `Lesson` (`lessons`) — clase de un módulo: `type` (VIDEO/ARTICLE/PRACTICE/QUIZ),
  `videoUrl`/`videoType` (estilo Platzi), `content` en Markdown, `duration` (min),
  `resources` (JSON: [{label, url}]), `isFree`, `published`, `position`.
  Slug único por módulo; el backend deduplica slugs a nivel de curso (las URLs de
  clase son `slug` legibles).
- El **progreso del alumno** vive en `localStorage` del navegador (no hay cuentas
  públicas): clave `kc:course-progress:v1`, por curso: clases completadas + última vista.
- El curso de ejemplo "Linux para novatos" (7 módulos, 33 clases) se siembra por
  migración (`20261012010000_seed_linux_course`), con ids fijos y `ON CONFLICT DO
  NOTHING`; la fuente editable es `tools/seed-course/linux-course.py`.

**Contenido del sitio (home / sobre mí)**:
- `TechCategory` (`tech_categories`) + `TechItem` (`tech_items`) — grid de tecnologías
  del inicio y de "Sobre mí", editables desde el CMS con orden propio.
- El hero, el "bio"/"expertise"/"now" de *Sobre mí* y la tarjeta de autor viven en
  `Setting` (KV) bajo la clave del sitio, con los valores por defecto del API
  (`SITE_DEFAULTS`) como respaldo cuando la fila aún no existe.

**Otros**: `Media` (subidas), `Setting` (KV de configuración), `TimelineEvent`.

---

## 6. API REST (prefijo global `/api/v1`)

Arranque (`apps/api/src/main.ts`): `helmet()`, CORS con `ALLOWED_ORIGINS` (en desarrollo
se añade además un regex que acepta localhost y rangos de red privada), `setGlobalPrefix('api/v1')`
y `ValidationPipe` global.

### Auth
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | `{email,password}` → `{accessToken, user}` (JWT) |

### Categorías (blog)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/categories` | — | Árbol completo principal → subcategorías |
| GET | `/categories/flat?category=` | — | Lista plana de subcategorías |
| PUT | `/categories/reorder` | JWT | Reordenar categorías principales (`{ids: []}`) |
| PUT | `/categories/subcategories/reorder` | JWT | Reordenar subcategorías |
| POST | `/categories` | JWT | Crear categoría principal (`name, slug, description?, position?, color?`) |
| PUT | `/categories/:id` | JWT | Editar categoría |
| DELETE | `/categories/:id` | JWT | Borrar (409 si está en uso) |
| POST | `/categories/subcategories` | JWT | Crear subcategoría (`mainCategoryId, name, slug, ...`) |
| PUT | `/categories/subcategories/:id` | JWT | Editar subcategoría |
| DELETE | `/categories/subcategories/:id` | JWT | Borrar (409 si está en uso) |

> Las rutas `reorder` se declaran **antes** de `@Put(':id')`: Nest resuelve por orden de
> declaración y si no, `reorder` se interpretaría como un `:id`.

### Posts / Blog
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/posts` | — | Publicados. Filtros: `?category=&subcategory=` |
| GET | `/posts/videos?limit=` | — | Últimos posts con video |
| GET | `/posts/categories` | — | *Deprecado* → alias de `/categories` |
| GET | `/posts/admin/all` | JWT | Todos los posts |
| GET | `/posts/admin/:id` | JWT | Un post por id |
| GET | `/posts/:slug` | — | Un post publicado por slug |
| POST | `/posts` | JWT | Crear (`mainCategoryId` obligatorio, `subCategoryId?`) |
| PUT | `/posts/:id` | JWT | Editar (mismo autor). `subCategoryId: null` la quita |
| DELETE | `/posts/:id` | JWT | Borrar (mismo autor) |

### Proyectos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/projects` | — | Proyectos publicados, ordenados por `position` |
| GET | `/projects/categories` | — | Clasificaciones con conteo |
| GET | `/projects/admin/all` | JWT | Todos (borradores incluidos) |
| PUT | `/projects/reorder` | JWT | Reordenar proyectos |
| PUT | `/projects/categories/reorder` | JWT | Reordenar clasificaciones |
| POST/PUT/DELETE | `/projects/categories[/:id]` | JWT | CRUD de clasificaciones |
| GET | `/projects/:slug` | — | Un proyecto por slug |
| POST/PUT/DELETE | `/projects[/:id]` | JWT | CRUD de proyectos |

### Recursos (descargables)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/resources` | — | Recursos publicados |
| GET | `/resources/types` | — | Tipos en uso, en orden |
| GET | `/resources/:slug` | — | Un recurso por slug |
| GET | `/resources/:slug/download` | — | Descarga: cuenta la descarga, sirve el archivo (`attachment`) o redirige 302 si es enlace externo |
| GET | `/resources/admin/all`, `/resources/admin/:id` | JWT | Listado/detalle de panel |
| PUT | `/resources/types/reorder` | JWT | Reordenar tipos |
| POST/PUT/DELETE | `/resources/types[/:id]` | JWT | CRUD de tipos (Recursos › Tipos) |
| POST/PUT/DELETE | `/resources[/:id]` | JWT | CRUD de recursos (borra también el archivo local) |

### Cursos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/courses` | — | Cursos con conteos reales de clases |
| GET | `/courses/:slug` | — | Árbol módulos → clases publicadas |
| GET | `/courses/admin/all`, `/courses/admin/:id` | JWT | Panel (árbol completo) |
| PUT | `/courses/:id/curriculum` | JWT | Guarda el árbol entero en una transacción: actualiza nodos con id, crea los nuevos, borra los ausentes y recalcula `lessonsCount` |
| POST/PUT/DELETE | `/courses[/:id]` | JWT | CRUD del curso |

### Sitio (contenido editable del home y "Sobre mí")
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/site` | — | Hero, sobre mí y tarjeta de autor (con defaults) |
| PUT | `/site` | JWT | Guardar una o más secciones (`hero`, `about`, `author`) |
| GET | `/tech` | — | Árbol de tecnologías (categorías → ítems) |
| POST | `/tech/categories`, `/tech/items` | JWT | Crear categoría / tecnología |
| PUT | `/tech/categories/reorder`, `/tech/items/reorder` | JWT | Reordenar (o mover de categoría) |
| PUT/DELETE | `/tech/categories/:id`, `/tech/items/:id` | JWT | Editar / borrar |

### Resto de módulos (JWT en escritura y en las rutas `/admin/*`)
- **Media**: `POST /media/upload` (multipart, imágenes JPG/PNG/GIF/WebP validadas por
  *magic bytes*, límite 10 MB) y `POST /media/upload-file` (archivos genéricos de
  Recursos, sin restricción de tipo, límite 25 MB).
- **Videos**: `GET /videos`, `GET /videos/admin/all`, CRUD.
- **Lab**: `GET /lab` (publicados), `GET /lab/:slug`, `GET /lab/admin/all`,
  `GET /lab/admin/:id`, CRUD. Los **hitos** van dentro de `milestones` (JSON).
- **Timeline**: `GET /timeline`, `GET /timeline/admin/all`, `GET /timeline/admin/:id`, CRUD.
- **Settings**: `GET /settings`, `GET /settings/:key` (públicos), `PUT /settings`, `DELETE /settings/:key` (JWT).
- **Health**: `GET /health`.

> La validación usa `ValidationPipe` global con `whitelist + forbidNonWhitelisted + transform`:
> propiedades no declaradas en los DTOs se rechazan (400). Los DTOs de *update* deben ser
> **clases** (no type aliases) para que la validación se aplique.

---

## 7. Frontend (Next.js 15 App Router)

El código vive en **`apps/web/src/`** (`src/app` para rutas, `src/components`, `src/lib`).

**Rutas públicas** (en español es la canónica; las inglesas redirigen, ver abajo)
- `/` (home: hero, artículos, videos, tecnologías, contacto), `/blog`, `/blog/[slug]`,
  `/contenido`, `/videos`, `/lab`, `/lab/[slug]`, `/proyectos`, `/proyectos/[slug]`,
  `/cursos`, `/cursos/[slug]`, `/cursos/[slug]/[lesson]`, `/recursos`, `/sobre-mi`,
  `/contacto`, `/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/api/health`.
- **Redirects permanentes** (`next.config.js`): `/projects → /proyectos`,
  `/resources → /recursos`, `/courses → /cursos`, `/about → /sobre-mi`,
  `/contact → /contacto`, `/now → /sobre-mi#ahora`. Las páginas inglesas existen en el
  repo pero solo re-exportan la versión española.
- `output: 'standalone'` solo se activa con `DOCKER_BUILD=true` (build de Docker);
  en local el build es normal.

**CMS** (`/admin`, protegido por sesión JWT en `localStorage` con `AuthGuard`; no hay middleware)
- **Dashboard** (`/admin`), **Inicio** (`/admin/inicio`: hero + grid de tecnologías),
  **Sobre mí** (`/admin/sobre-mi`: bio, expertise y "ahora").
- **Artículos** — con **Categorías** como submenú (`/admin/posts`, `/admin/categorias`:
  CRUD + reordenar arrastrando).
- **Videos**, **Proyectos** (con **Clasificación** en `/admin/projects/clasificacion`),
  **Cursos** (+ botón "Contenido": editor estilo Platzi en `/admin/courses/[id]` para
  crear módulos y clases, subir video por clase, marcar clases publicadas/ocultas,
  reordenar con arrastre o flechas, vista previa de Markdown, recursos y borrador
  automático en el navegador).
- **Lab** (`/admin/lab`, `/admin/lab/new`, `/admin/lab/[id]`) — con **editor de hitos**
  (timeline interactiva) sobre la ficha del experimento.
- **Recursos** (`/admin/recursos` + **Tipos** en `/admin/recursos/tipos`): editor con
  subida de archivo (25 MB) o enlace externo, tipo editable, versión, etiquetas,
  destacado y orden.
- **Timeline** y **Configuración** (`/admin/settings`, KV del sitio).
- Editor de artículos con **TipTap** (bloques, código resaltado, tablas, imágenes con
  redimensionado, iframes, comandos slash `/`), compartido con proyectos y lab.

**Caché y revalidación**
- Los `fetch` de datos usan *tags*: `posts`, `videos`, `categories`, `site`, `timeline`
  (`staleTimes` en 0).
- `POST /api/revalidate` (header `x-revalidate-secret`, opcional `{slug}`) invalida esos
  tags y las rutas `/`, `/blog`, `/lab`, `/recursos`, `/feed.xml`, `/sitemap.xml`
  (y `/blog/:slug`, `/lab/:slug` si se envía el slug). El panel lo llama
  automáticamente al guardar (`api.revalidateSite()`).
- `GET /api/health` responde `{status:'ok', service:'kevincarmen-web'}`.

**Taxonomía en el frontend**
- `src/lib/categories.ts` — paleta de 10 colores (`CATEGORY_COLORS`), color estable por
  slug como respaldo, mapeo de slugs antiguos.
- `src/lib/resource-icons.ts` — `RESOURCE_ICONS` / `RESOURCE_ICON_OPTIONS` para el
  icono de cada tipo de recurso.
- `src/lib/lab-milestone.ts` — tipos y utilidades de los hitos del lab.
- `src/components/blog/category-badge.tsx` — badge principal + subcategoría;
  `src/components/blog/post-toc.tsx` — TOC flotante con scrollspy (FAB + hoja deslizante en móvil).
- `src/lib/api/*.ts` — clientes tipados por recurso (`categories`, `courses`, `lab`,
  `posts`, `projects`, `resources`, `site`, `timeline`) + `client.ts` (token, subida, revalidación).

---

## 8. Variables de entorno

`.env.example` es la plantilla; en el servidor el `.env` real vive en `/var/www/kevincarmen/.env`
(ignorado por git, sobrevive a los deploys).

| Variable | Ámbito | Uso |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | compose | Credenciales de Postgres |
| `DATABASE_URL` | api | Conexión Prisma |
| `REDIS_URL` | api | Reservado (Redis no se usa aún) |
| `JWT_SECRET` | api | Firma de los tokens |
| `ALLOWED_ORIGINS` | api | Lista CORS separada por comas |
| `PUBLIC_SITE_HOSTS` | api | Hosts propios: al guardar, los enlaces internos se normalizan a ruta relativa |
| `PORT` | api | 4001 |
| `UPLOAD_DIR` | api | Carpeta de subidas (Docker: `/uploads`) |
| `NEXT_PUBLIC_API_URL` | web | `/api/v1` en producción (mismo origen vía nginx) |
| `API_INTERNAL_URL` | web | `http://api:4001/api/v1` dentro de Docker |
| `API_PROXY_TARGET` | web (dev) | Destino del rewrite de Next hacia NestJS |
| `REVALIDATE_SECRET` / `NEXT_PUBLIC_REVALIDATE_SECRET` | web | Secreto compartido de `/api/revalidate` |
| `DOCKER_BUILD` | web | `true` activa `output: 'standalone'` (lo fija el Dockerfile) |

---

## 9. Deuda técnica y riesgos conocidos

- **`apps/cms` es huérfano** (solo `package.json`); el CMS real vive en `apps/web/src/app/admin`.
- **`packages/types` está desincronizado** con la taxonomía y los modelos actuales
  (`Post` no refleja `mainCategory`/`subCategory`) y solo lo importa `src/lib/data/mock.ts`.
  Además NestJS no puede importar paquetes publicados como fuente TS en runtime.
  **No duplicar ahí la taxonomía** hasta reestructurarlo.
- **Redis está provisionado pero sin uso**: ningún módulo del API crea un cliente Redis
  (`REDIS_URL` solo se declara). O se integra como caché/colas o se retira del compose.
- **`Page` y `Comment` existen en el esquema sin módulo en la API** (no hay controlador
  ni servicio): el blog no tiene comentarios ni páginas estáticas gestionadas.
- **Sin tests automatizados**: ningún `package.json` define `test` (ni jest/vitest).
- **`/posts/categories` es un alias deprecado** de `/categories`; conviene eliminarlo
  cuando ya no lo use ninguna versión en caché del frontend.
- **Versión de Prisma**: el runner del api instala `prisma@6.19.3` mientras
  `devDependencies` declara `^6.1.0` (conviene alinear con `@prisma/client`).
- **Husky está instalado pero sin hooks** (solo `.husky/_`); `pnpm format` es manual.
- Nginx limita el cuerpo a 15 MB: **coincide** con el límite de 25 MB del endpoint de
  archivos por accidente, no por diseño — si un recurso sube de 15 MB fallará en nginx,
  no en la API. Alinear ambos límites si se suben archivos grandes.

---

## 10. Desarrollo local

```bash
# clonar y sincronizar deps
cd C:\Users\Kevin Carmen\kevincarmen
pnpm install

# desarrollo (raíz): web :3000 + api :4001
pnpm dev
# o individual
pnpm --filter @kevincarmen/web dev
pnpm --filter @kevincarmen/api dev

# builds de producción
pnpm --filter @kevincarmen/api build   # nest build
pnpm --filter @kevincarmen/web build   # next build

# prisma (dentro de apps/api)
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

Para probar el flujo Docker tal cual producción:

```bash
docker compose up -d --build     # postgres, redis, api, web, nginx en 127.0.0.1
```

---

## 11. Cómo ver el diagrama y este documento

**Diagrama interactivo** (Archify) — **`archify/kevincarmen-architecture.html`**
- Está **en español** (visores, leyenda y contenido).
- Es un **único HTML autocontenido** (~765 KB, funciona sin internet).
- Ábrelo **en cualquier navegador** (doble clic). Atajos dentro del visor:
  - `S` = presets de estilo / `T` = tema claro-oscuro
  - `/` = buscar nodos · `R` = trazar una ruta dirigida · `L` = comparar roles
  - `E` = exportar PNG / SVG / WebM / tarjeta 1200×630
- Fuente editable: `archify/kevincarmen-architecture.json` (edítalo y regenera con archify).
- *(También puedes arrastrar el archivo `.html` a la ventana del navegador.)*

**Este documento** — **`README.md`**
- Ábrelo con cualquier visor de Markdown (VS Code / Cursor, Obsidian, Typora, GitHub).
- En el chat de Hermes se renderiza solo: los bloques y tablas de arriba ya están formateados.
- Otros documentos del repo: `AGENTS.md` (reglas para asistentes de IA) y
  `CAMBIOS-MENU-NAVEGACION.md` (notas del rediseño de navegación).

> Rutas (desde `C:\Users\Kevin Carmen\kevincarmen\`):
> - Diagrama: `archify/kevincarmen-architecture.html`
> - IR editable: `archify/kevincarmen-architecture.json`
> - Este documento: `README.md`

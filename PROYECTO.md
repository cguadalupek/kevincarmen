# kevincarmen.xyz — Documentación del proyecto

> **Monorepo** (Turborepo) de la plataforma personal **Kevincarmen.xyz**.
> Blog, CMS y portafolio. Frontend en Next.js + API en NestJS + Prisma/PostgreSQL.

---

## 1. Resumen

| | |
|---|---|
| **Frontend** | `apps/web` — Next.js 15 (App Router), React 19, Tailwind CSS 3 |
| **Backend** | `apps/api` — NestJS 10, Prisma 6, class-validator, passport-jwt |
| **Base de datos** | PostgreSQL 16 + Redis 7 (ambos en Docker) |
| **Monorepo** | Turborepo + pnpm 9.15, Node ≥ 20 |
| **Despliegue** | LXC (Proxmox) + Docker Compose + Cloudflare Tunnel |
| **Dominio** | `kevincarmen.xyz` (blog público) y `/admin` (CMS) en español |

---

## 2. Estructura del monorepo

```
kevincarmen/
├── apps/
│   ├── web/        Next.js 15 · sitio público + CMS /admin
│   ├── api/        NestJS · API REST (prefijo /api/v1) + Prisma
│   └── cms/        (huérfano: solo package.json, no se usa)
├── packages/
│   ├── config/     @kevincarmen/config    · siteConfig, etc.
│   ├── types/      @kevincarmen/types     · tipos compartidos (fuente TS)
│   └── utils/      @kevincarmen/utils     · formatDate, slugify, etc.
├── docker-compose.yml   · postgres, redis, api, web, nginx
├── nginx/nginx.conf     · reverse proxy (/, /api/v1/, /uploads)
├── deploy/install-docker.sh
└── turbo.json, pnpm-workspace.yaml
```

Comandos raíz: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`.

---

## 3. Arquitectura de runtime

```
Visitantes ──HTTPS──▶ Cloudflare Edge (túnel) ──▶ nginx:80
                                                   ├── /        → Web :3000 (Next SSR)
                                                   ├── /api/v1  → API :4001 (NestJS)
                                                   └── /uploads → volumen compartido
Web ──API_INTERNAL_URL──▶ API ──▶ PostgreSQL :5432
                              └──▶ Redis :6379 (caché)
```

- **Web** renderiza en servidor (App Router) y llama a la API por `API_INTERNAL_URL` (dentro de la red Docker: `http://api:4001/api/v1`). En el navegador usa la ruta relativa `/api/v1` a través de nginx.
- **nginx** sirve el sitio, proxya `/api/v1/*` y los estáticos de `/uploads/posts/*`.
- **API** expone REST bajo `/api/v1` y recibe peticiones del navegador o de la Web.
- **PostgreSQL** guarda todo el contenido; **Redis** se usa como capa de caché.
- **Imágenes**: las portadas se suben por `POST /media/upload` y caen en el volumen `uploads_data`; nginx las sirve en `/uploads/posts/*`.

### Infraestructura real (servidor)

- **LXC** `kevincarmen` sobre Proxmox (Debian 12, hostname `kevincarmen`).
- **Docker Compose** (desde el worktree `/opt/kevincarmen`) con 5 servicios.
- **Cloudflare Tunnel** (`cloudflared`, servicio del host) expone el sitio sin IP pública.
- **Git bare** en `/opt/repo.git` + hook `post-receive` (ver §4).

---

## 4. Despliegue (cómo llegan los cambios a producción)

1. Se hace `git push` a `root@192.168.1.108:/opt/repo.git` (repo *bare*).
2. El hook **post-receive** hace:
   ```sh
   GIT_WORK_TREE=/opt/kevincarmen git checkout -f
   cd /opt/kevincarmen && docker compose up -d --build
   ```
3. En el arranque, el contenedor `api` ejecuta:
   ```sh
   prisma migrate deploy && node dist/main.js
   ```
   → **las migraciones se aplican solas** al recrear el contenedor.

> ⚠️ Pushear a `master` = desplegar a producción. Las features se trabajan en ramas
> y se fusionan a `master` para desplegar.

---

## 5. Modelo de datos (Prisma → PostgreSQL)

Las migraciones viven en `apps/api/prisma/migrations/` y se aplican en orden lexicográfico.

**Usuarios y seguridad**: `User`, `Role`, `Permission`

**Blog / contenido**:
- `Post` — título, slug, excerpt, content (Markdown), portada, video, enlaces externos,
  estado (`DRAFT/PUBLISHED/SCHEDULED/TRASHED`), destacado, tiempo de lectura, autor, fechas.
  Clasificación obligatoria: `mainCategoryId` + `subCategoryId?`.
- `Tag`, `PostTag` — etiquetas (N:M).
- `Page` — páginas estáticas.
- `Comment` — comentarios (con aprobación).

**Taxonomía (nivel 1 y 2)**:
- `MainCategory` (`main_categories`) — **tabla editable desde el CMS** (no enum):
  `slug`, `name`, `description`, `position`, `color` (clave de paleta).
- `Subcategory` (`subcategories`) — cuelga de una principal (`mainCategoryId`),
  `(mainCategoryId, slug)` único.
- Un **trigger de Postgres** (`enforce_post_subcategory_parent`) impide asignar a un post
  una subcategoría de otra categoría principal.
- Filtro público: `?category=<slug>` (o slug antiguo) y `?subcategory=<slug>`.

**Portafolio y multiformato**: `Project`, `Video`, `Course`, `LabExperiment` (lab_services).

**Cursos con curriculum (módulos + clases)**:
- `Course` — además de lo anterior: `subtitle`, `learningPoints`, `requirements`, `targetAudience`.
- `CourseModule` (`course_modules`) — agrupa clases; cuelga de un curso con `onDelete: Cascade`.
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

**Otros**: `Media` (subidas), `Setting` (KV de configuración), `TimelineEvent`.

---

## 6. API REST (prefijo global `/api/v1`)

### Auth
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | `{email,password}` → `{accessToken, user}` (JWT) |

### Categorías
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/categories` | — | Árbol completo principal → subcategorías |
| GET | `/categories/flat?category=` | — | Lista plana de subcategorías |
| POST | `/categories` | JWT | Crear categoría principal (`name, slug, description?, position?, color?`) |
| PUT | `/categories/:id` | JWT | Editar categoría |
| DELETE | `/categories/:id` | JWT | Borrar (409 si está en uso) |
| POST | `/categories/subcategories` | JWT | Crear subcategoría (`mainCategoryId, name, slug, ...`) |
| PUT | `/categories/subcategories/:id` | JWT | Editar subcategoría |
| DELETE | `/categories/subcategories/:id` | JWT | Borrar (409 si está en uso) |

### Posts / Blog
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/posts` | — | Publicados. Filtros: `?category=&subcategory=` |
| GET | `/posts/categories` | — | *Deprecado* → alias de `/categories` |
| GET | `/posts/videos?limit=` | — | Últimos posts con video |
| GET | `/posts/admin/all` | JWT | Todos los posts |
| GET | `/posts/admin/:id` | JWT | Un post por id |
| GET | `/posts/:slug` | — | Un post publicado por slug |
| POST | `/posts` | JWT | Crear (`mainCategoryId` obligatorio, `subCategoryId?`) |
| PUT | `/posts/:id` | JWT | Editar (mismo autor). `subCategoryId: null` la quita |
| DELETE | `/posts/:id` | JWT | Borrar (mismo autor) |

### Resto de módulos (JWT en escritura/lectura admin)
- **Media**: `POST /media/upload` (multipart) → sube imagen.
- **Videos**: `GET /videos`, `GET /videos/admin/all`, CRUD.
- **Cursos**: `GET /courses` (público, con conteos reales), `GET /courses/:slug`
  (público: árbol módulos → clases publicadas), `GET /courses/admin/all`,
  `GET /courses/admin/:id` (árbol completo), CRUD, y
  `PUT /courses/:id/curriculum` (guarda el árbol entero en una transacción:
  actualiza los nodos con id, crea los nuevos, borra los ausentes y recalcula
  `lessonsCount`).
- **Lab**: CRUD de experimentos (`lab/admin/all`, `lab/:id`, …).
- **Proyectos**: CRUD de proyectos (status, tecnologías, portafolio).
- **Settings**: `GET/PUT /settings` (KV).
- **Timeline**: CRUD de eventos (educación/trabajo/proyecto/logro).
- **Health**: `GET /health`.

> La validación usa `ValidationPipe` global con `whitelist + forbidNonWhitelisted + transform`:
> propiedades no declaradas en los DTOs se rechazan (400). Los DTOs de *update* deben ser
> **clases** (no type aliases) para que la validación se aplique.

---

## 7. Frontend (Next.js 15 App Router)

**Rutas públicas**
- `/`, `/blog`, `/blog/[slug]`, `/proyectos`, `/proyectos/[slug]`, `/lab`, `/lab/[slug]`,
  `/videos`, `/courses`, `/cursos`, `/recursos`, `/resources`, `/about`, `/sobre-mi`,
  `/now`, `/contacto`, `/contenido`, `/feed.xml`, `/sitemap.xml`, `/robots.txt`.

**CMS** (`/admin`, protegido por sesión JWT en `localStorage`)
- Dashboard, **Artículos** (+ **Categorías** como submenu), Videos, Proyectos, Cursos, Lab,
  Timeline, Configuración.
- **Cursos → botón "Contenido"**: editor estilo Platzi (`/admin/courses/[id]`) para crear
  módulos y clases, subir video por clase, marcar clases publicadas/ocultas, reordenar con
  arrastre o flechas, vista previa del Markdown, recursos, y borrador automático en el
  navegador contra pérdidas de trabajo.
- Editor de artículos con **TipTap** (bloques, código, imágenes, redimensionado, slash `/`).

**Taxonomía en el frontend**
- `src/lib/categories.ts` — paleta de 10 colores (`CATEGORY_COLORS`), color estable por
  slug como respaldo, mapeo de slugs antiguos.
- `src/components/blog/category-badge.tsx` — badge principal + subcategoría.
- `src/lib/api/categories.ts` — tipos del árbol + `getCategoryTree()`.

---

## 8. Decisiones y tangentes que conviene conocer

- **Categorías = tabla, no enum**: un enum de Postgres no se amplía en runtime; por eso se
  migró a `main_categories` editables (con color por categoría).
- **`packages/types` está desincronizado** y en producción** no se usan para posts (solo lo
  importa `mock.ts`); además NestJS no puede importar paquetes publicados como fuente TS en
  runtime. No duplicar ahí la taxonomía.
- **apps/cms es huérfano** (solo `package.json`); el CMS real vive en `apps/web/app/admin`.
- **Riesgos anotados**:
  - PostgreSQL (5432) y Redis (6379) escuchan en `0.0.0.0` (accesibles en la LAN). Se
    recomienda mapearlos a `127.0.0.1` en el compose.
  - Disco en 83% con ~36 GB de *build cache* de Docker reclamables (`docker builder prune`).
  - El runner del api instala `prisma@6.19.3` mientras `devDependencies` declara `^6.1.0`
    (conviene alinear).

---

## 9. Desarrollo local

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

---

## 10. Cómo ver el diagrama y este documento

**Diagrama interactivo** (Archify) — **`archify/kevincarmen-architecture.html`**
- Está **en español** (visores, leyenda y contenido).
- Es un **único HTML autocontenido** (~765 KB, funciona sin internet).
- Ábrelo **en cualquier navegador** (doble clic). Atajos dentro del visor:
  - `S` = presets de estilo / `T` = tema claro-oscuro
  - `/` = buscar nodos · `R` = trazar una ruta dirigida · `L` = comparar roles
  - `E` = exportar PNG / SVG / WebM / tarjeta 1200×630
- Fuente editable: `archify/kevincarmen-architecture.json` (edítalo y regenera con archify).
- *(También puedes arrastrar el archivo `.html` a la ventana del navegador.)*

**Este documento** — **`PROYECTO.md`**
- Ábrelo con cualquier visor de Markdown (VS Code / Cursor, Obsidian, Typora, GitHub).
- En el chat de Hermes se renderiza solo: los bloques y tablas de arriba ya están formateados.

> Rutas (desde `C:\Users\Kevin Carmen\kevincarmen\`):
> - Diagrama: `archify/kevincarmen-architecture.html`
> - IR editable: `archify/kevincarmen-architecture.json`
> - Este documento: `PROYECTO.md`
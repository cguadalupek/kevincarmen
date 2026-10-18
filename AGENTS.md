# AGENTS.md — Reglas para asistentes de IA

> Documento **exclusivamente** para asistentes de código (Cursor, Aider, OpenCode, Copilot, etc.).
> Describe la arquitectura real del monorepo, las zonas prohibidas y las restricciones técnicas.
> Si una instrucción del usuario contradice este archivo, gana el usuario — pero avísale del conflicto.
> Documentación funcional completa: `README.md`.

---

## 1. Contexto de arquitectura

Monorepo con **pnpm workspaces** (`pnpm-workspace.yaml`: `apps/*` y `packages/*`) orquestado por
**Turborepo 2**. Node ≥ 20, `packageManager: pnpm@9.15.0`. El idioma del proyecto es **español**:
UI, textos, nombres de rutas públicas, comentarios y mensajes de commit.

```
kevincarmen/
├── apps/web     Next.js 15 (App Router) + React 19 + Tailwind 3 + TipTap 3 → sitio + CMS
├── apps/api     NestJS 10 + Prisma 6 + PostgreSQL → API REST /api/v1
├── apps/cms     ⛔ HUÉRFANO (solo package.json) — NO TOCAR
└── packages/
    ├── config   @kevincarmen/config  · siteConfig (identidad, nav, social)
    ├── types    @kevincarmen/types   ⚠️ DESINCRONIZADO — solo tipos, uso restringido
    └── utils    @kevincarmen/utils   · cn, slugify, formatDate, calculateReadingTime, truncate
```

- **`apps/web`** — un solo proyecto Next.js que contiene el sitio público **y** el CMS
  (`src/app/admin`). Renderiza en servidor (Server Components) y consume la API.
- **`apps/api`** — API REST de NestJS; única capa que habla con PostgreSQL (Prisma).
  No expone lógica de presentación y no renderiza HTML.
- **`packages/config`** — configuración de identidad del sitio (nombre, descripción, social, nav).
- **`packages/utils`** — utilidades puras sin dependencias de runtime.
- **`packages/types`** — tipos TS compartidos; **no** es la fuente de verdad del modelo de datos.

Comandos (desde la raíz):

```bash
pnpm dev            # turbo dev → web :3000 + api :4001
pnpm build          # turbo build
pnpm lint           # turbo lint
pnpm format         # prettier --write
pnpm --filter @kevincarmen/api dev      # solo api
pnpm --filter @kevincarmen/web build    # solo web
```

---

## 2. Zonas prohibidas y deuda técnica

### ⛔ NO generar ni modificar código en `apps/cms`
Es un directorio huérfano: contiene **solo** un `package.json` con un script `dev` de eco.
El CMS real vive en `apps/web/src/app/admin` (+ `apps/web/src/components/admin`).
Nunca añadas rutas, componentes, dependencias ni imports hacia `@kevincarmen/cms`.

### ⚠️ `packages/types` está desincronizado
- `Post`, `Category`, etc. **no** reflejan el modelo actual (falta la taxonomía de dos niveles
  `mainCategory` / `subCategory`, entre otros cambios).
- **No dupliques la taxonomía, los posts ni los modelos nuevos ahí.**
- **No importes** datos de posts desde `@kevincarmen/types`. Hoy su único consumidor real es
  `apps/web/src/lib/data/mock.ts`.
- NestJS **no puede** consumir un paquete publicado como fuente TS en runtime: el API no debe
  depender de `@kevincarmen/types` para DTOs ni entidades.
- Si necesitas un tipo compartido, defínelo en el `lib/api/*.ts` del web o en el módulo del API
  correspondiente. Reestructurar `packages/types` es una tarea aparte, nunca un efecto colateral.

### Otras reglas derivadas de la deuda técnica
- **Redis**: está en `docker-compose.yml` pero ningún módulo lo usa. No escribas código que
  asuma un cliente Redis existente; si lo integras, primero crea el módulo y actualiza el README.
- **`Page` y `Comment`** existen en `schema.prisma` sin módulo en la API. No los uses como si
  tuvieran endpoints.
- **Sin tests**: no hay script `test` ni framework instalado. No inventes `pnpm test`.

---

## 3. Reglas de backend (`apps/api`)

- **NestJS 10 + Prisma 6**. Un módulo por dominio bajo `src/<dominio>/` con
  `*.module.ts`, `*.controller.ts`, `*.service.ts` y `dto/`. Registra el módulo en `app.module.ts`.
- **Prefijo global REST `/api/v1`** (`app.setGlobalPrefix('api/v1')` en `main.ts`). No lo repitas
  en los `@Controller()`: escribe `@Controller('posts')`, nunca `@Controller('api/v1/posts')`.
- **`ValidationPipe` global** con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`:
  cualquier propiedad no declarada en el DTO produce **400**. Mantén los DTOs exactos.
- **REGLA CRÍTICA — los DTO de actualización (`UpdateXDto`) DEBEN ser clases** con decoradores de
  `class-validator`, **nunca `type` aliases ni interfaces**. Con un alias, la metadata de
  validación no se emite y las peticiones de edición fallan (o pasan sin validar).
  Usa `@IsOptional()` en cada campo y `@ValidateIf`/`@IsNull()` para distinguir "no enviado" de
  "enviar null" (p. ej. `subCategoryId: null` para quitar la subcategoría).
- **Autorización**: `JwtAuthGuard` en toda escritura y en toda ruta `/admin/*`. Los `GET`
  públicos van sin guard. No inventes roles nuevos: hoy la autorización es binaria (autenticado o no).
- **Rutas con segmento literal antes de `:id`**: Nest resuelve por orden de declaración. Declara
  `/reorder`, `/types`, `/categories`, `/admin/all` **antes** de `@Put(':id')` / `@Get(':slug')`,
  o el segmento literal se interpretará como parámetro.
- **Errores HTTP con excepciones de Nest** (`NotFoundException`, `BadRequestException`,
  `ConflictException`, `ForbiddenException`), con mensajes **en español** orientados al usuario.
- **Subidas**: las imágenes se validan por *magic bytes* (JPG/PNG/GIF/WebP), no solo por el
  `mimetype` del cliente, y se guardan con nombre UUID en `UPLOAD_DIR`. Nunca escribas dentro de
  `public/` del web: en `output: standalone` no se sirve en runtime.
- **No metas lógica de negocio en los controladores**: los servicios concentran validaciones de
  dominio (pertenencia de subcategoría a categoría, deduplicación de slugs, conteos, etc.).

### Base de datos

- **Todo cambio de `schema.prisma` exige su migración** en `apps/api/prisma/migrations/`
  (carpeta con `migration.sql`, nombre `AAAAMMDDhhmmss_descripcion`). El contenedor ejecuta
  `prisma migrate deploy` al arrancar: **no apliques SQL a mano en producción**, commitea la migración.
- Añadir una columna `NOT NULL` con filas existentes se hace en tres pasos:
  `NULL` → backfill (`UPDATE`/`DO $$ … RAISE NOTICE`) → `SET NOT NULL`.
- Mantén `@@map` en snake_case y los nombres de columna con `@map` (los modelos del repo ya lo hacen).
- Respeta `onDelete: Restrict` en las relaciones de taxonomía: borrar una categoría en uso debe
  dar **409**, no borrar posts en cascada.
- Si el cambio afecta a un seed (`tools/seed-course/linux-course.py`), mantén ids fijos y
  `ON CONFLICT DO NOTHING` para que sea re-ejecutable.

---

## 4. Reglas de frontend (`apps/web`)

- **Next.js 15 con App Router**. El código está en **`src/`**: rutas en `src/app`, componentes en
  `src/components`, clientes de datos en `src/lib/api`. No crees una carpeta `app/` en la raíz
  de `apps/web`.
- Las rutas en español (`/proyectos`, `/recursos`, `/cursos`, `/sobre-mi`, `/contacto`) son las
  canónicas. Las inglesas solo redirigen desde `next.config.js`; no las dupliques con lógica nueva.
- **Consumo de la API**: usa siempre la ruta relativa `/api/v1` en el navegador y
  `API_INTERNAL_URL` en Server Components. El cliente tipado por recurso vive en
  `src/lib/api/<recurso>.ts` y `client.ts` (token, subida, revalidación). **No hagas `fetch`
  a URLs absolutas ni a `localhost`** en componentes.
- **Server Components por defecto**: añade `'use client'` solo cuando haya estado, efectos o
  eventos. El CMS completo es cliente.
- **Caché**: los `fetch` de datos usan `next: { tags: [...] }` con los tags exportados
  (`POSTS_CACHE_TAG`, `SITE_CACHE_TAG`, `TIMELINE_CACHE_TAG`, …). Tras **cualquier guardado en el
  panel**, llama a `api.revalidateSite()` (o `api.revalidateSite(slug)`) para invalidar el tag y
  las rutas; sin eso el sitio público sigue mostrando datos cacheados.
- **Autenticación del CMS**: no hay `middleware.ts`. `AuthGuard` valida el token guardado en
  `localStorage` y `client.ts` lo inyecta en las peticiones. No introduzcas cookies, sesiones de
  servidor ni NextAuth sin cambiar también el guard del API.
- **Estilos**: Tailwind CSS 3 con los tokens del tema (`bg-card`, `text-muted-foreground`,
  `border-border`, …) y `cn()` de `@kevincarmen/utils` para clases condicionales. No escribas
  colores hex crudos ni CSS a medida si existe un token. La UI debe ser **mobile-first**
  (la propietaria del CMS trabaja desde el móvil y el dueño desde escritorio): mantén las
  áreas táctiles (`min-h-[44px]`) y no rompas el layout responsive.
- **Editor enriquecido**: artículos, proyectos, lab y cursos comparten el mismo editor
  (`src/components/admin/editor/cms-editor.tsx`, exporta `CMSEditor`) — no escribas un editor
  nuevo ni dupliques extensiones: las capacidades se añaden en `tiptap.config.ts` y las
  diferencias por sección en `cms-sections.ts`. Si cambias extensiones o el Markdown de salida,
  revisa **los cuatro** formularios y la vista pública que lo renderiza
  (`react-markdown` + `remark-gfm`).
- **Imágenes**: usa `next/image` con los `remotePatterns` declarados; para subidas propias, la URL
  relativa que devuelve el API (`/uploads/...`).
- **Accesibilidad**: los componentes interactivos llevan `aria-*`, foco visible y
  `prefers-reduced-motion` respetado (hay animaciones con framer-motion).

---

## 5. Flujo de trabajo y entrega

1. **Un cambio = un commit con mensaje en español**, estilo del repo:
   `tipo(ámbito): descripción corta` — p. ej. `blog(articulo): TOC móvil como FAB`,
   `lab(admin): hitos en pestaña propia`, `chore:`, `feat:`, `fix:`.
2. **Verifica antes de entregar**: `pnpm --filter <paquete> build` y `pnpm lint` del paquete tocado.
   No declares "listo" sin salida real de compilación.
3. **`git push` a `origin` = deploy a producción.** `master` se despliega automáticamente
   (hook `post-receive` → `docker compose up -d --build`). Nunca pushees a `master` sin que el
   usuario lo pida; para cambios que no requieren rebuild (documentación, comentarios), avisa.
4. **No hagas commits de ruido**: no reformatees archivos ajenos al cambio, no mezcles
   CRLF↔LF masivos, no subas `node_modules`, `.env`, `*.bundle` ni artefactos de build.
5. **No modifiques `.env` ni secretos.** `.env.example` es la plantilla: si añades una variable
   nueva, documéntala ahí y en el README (`§8`).
6. **Mantén la documentación sincronizada**: si añades endpoints, modelos, rutas del CMS o
   variables de entorno, actualiza `README.md` en el mismo cambio.
7. **Antes de reescribir un archivo entero**, prefiere ediciones incrementales ancladas a texto
   único; hay componentes grandes (editores TipTap, páginas del panel) donde un reemplazo total
   pierde cambios no vistos.

---

## 6. Errores frecuentes (evítalos)

| Síntoma | Causa / regla |
|---|---|
| Edición devuelve 400 con campos válidos | `UpdateXDto` es un `type` alias en vez de una clase |
| 400 por "property X should not exist" | El DTO no declara el campo (el pipe usa `forbidNonWhitelisted`) |
| `/categories/reorder` responde como `:id` | La ruta literal está declarada después de `@Put(':id')` |
| El sitio público no refleja un guardado | Falta `api.revalidateSite()` (tags de caché sin invalidar) |
| Las subidas dan 413 | Nginx limita a 15 MB; alinear antes de subir archivos mayores |
| Archivos subidos en runtime no se sirven | Se escribieron en `public/` (no se sirve en `output: standalone`) |
| `prisma migrate deploy` no aplica nada nuevo | El cambio de esquema se hizo sin crear la migración |
| El build de Docker se comporta distinto al local | `output: 'standalone'` solo con `DOCKER_BUILD=true` |

---

## 7. Referencias

- `README.md` — arquitectura, modelo de datos, endpoints, despliegue y variables de entorno.
- `apps/api/prisma/schema.prisma` — fuente de verdad del modelo.
- `nginx/nginx.conf` y `docker-compose.yml` — routing y runtime real.
- `archify/kevincarmen-architecture.html` — diagrama interactivo de la arquitectura.

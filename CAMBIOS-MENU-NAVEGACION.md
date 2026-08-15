# Cambios de Navegación y UX

## Menú principal

La navegación principal quedó reducida a cinco enlaces:

| Etiqueta | Ruta |
| --- | --- |
| Inicio | `/` |
| Proyectos | `/proyectos` |
| Blog | `/blog` |
| Sobre mí | `/sobre-mi` |
| Contacto | `/contacto` |

Contacto se muestra como llamada a la acción visual tanto en el menú de escritorio como en el drawer móvil.

## Consolidación de secciones

- El contenido principal de Lab se integró en la sección `#homelab` de Proyectos.
- Recursos y Cursos ahora tienen accesos destacados desde Blog.
- El bloque Now se integró en la sección `#ahora` de Sobre mí.
- El footer reutiliza automáticamente la nueva navegación centralizada.

## Compatibilidad de URLs antiguas

Se añadieron redirecciones permanentes para conservar enlaces existentes:

- `/projects` -> `/proyectos`
- `/lab` -> `/proyectos#homelab`
- `/resources` -> `/recursos`
- `/courses` -> `/cursos`
- `/about` -> `/sobre-mi`
- `/contact` -> `/contacto`
- `/now` -> `/sobre-mi#ahora`

## Archivos principales modificados

- `packages/config/src/index.ts`: definición de los cinco enlaces principales.
- `apps/web/src/components/layout/header.tsx`: navegación desktop, drawer móvil y CTA Contacto.
- `apps/web/src/app/projects/page.tsx`: sección Homelab integrada.
- `apps/web/src/app/blog/page.tsx`: enlaces a Recursos y Cursos.
- `apps/web/src/app/about/page.tsx`: sección Lo que estoy haciendo ahora.
- `apps/web/next.config.js`: redirecciones desde las rutas antiguas.
- `apps/web/src/app/sitemap.ts`: sitemap con las rutas canónicas.
- `apps/web/src/app/proyectos/page.tsx`: ruta canónica de Proyectos.
- `apps/web/src/app/sobre-mi/page.tsx`: ruta canónica de Sobre mí.
- `apps/web/src/app/contacto/page.tsx`: ruta canónica de Contacto.
- `apps/web/src/app/recursos/page.tsx`: ruta canónica de Recursos.
- `apps/web/src/app/cursos/page.tsx`: ruta canónica de Cursos.

## Verificaciones

- TypeScript de `apps/web`: correcto.
- TypeScript de `apps/api`: correcto.
- ESLint: correcto.
- Build de Next.js: correcto.
- Rutas nuevas: HTTP 200.
- Rutas antiguas: HTTP 308 hacia las rutas canónicas.
- `git diff --check`: correcto.

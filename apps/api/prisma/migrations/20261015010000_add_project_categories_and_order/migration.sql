-- Clasificaciones de proyectos editables + orden manual de los proyectos.
--
-- (1) `project_categories`: antes las clasificaciones ("Software", "Web", …) eran una
--     lista FIJA en el formulario del CMS; ahora son filas de tabla igual que
--     `main_categories` del blog, para poder crearlas/renombrarlas/reordenarlas.
-- (2) `projects.position`: orden manual del listado público (menor = primero). Se
--     numera a múltiplos de 10 para insertar entre dos sin renumerar todo; sin esta
--     normalización todos los proyectos nacían con 0 y el orden quedaba indefinido.
-- (3) `projects.project_category_id`: FK a la nueva tabla. La columna de texto
--     `category` se conserva (denormalizada) por compatibilidad con lo ya publicado.

-- CreateTable
CREATE TABLE "project_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_name_key" ON "project_categories"("name");
CREATE UNIQUE INDEX "project_categories_slug_key" ON "project_categories"("slug");
CREATE INDEX "project_categories_position_idx" ON "project_categories"("position");

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "project_category_id" TEXT,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "projects_project_category_id_idx" ON "projects"("project_category_id");
CREATE INDEX "projects_position_idx" ON "projects"("position");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_category_id_fkey"
FOREIGN KEY ("project_category_id") REFERENCES "project_categories"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Semilla: las clasificaciones que traía el formulario, para que el CMS no arranque
-- vacío. `ON CONFLICT DO NOTHING` cubre colisiones de name Y de slug.
INSERT INTO "project_categories" ("id", "name", "slug", "position", "updated_at") VALUES
  ('pc_software',       'Software',       'software',       10, CURRENT_TIMESTAMP),
  ('pc_web',            'Web',            'web',            20, CURRENT_TIMESTAMP),
  ('pc_infraestructura','Infraestructura','infraestructura',30, CURRENT_TIMESTAMP),
  ('pc_automatizacion', 'Automatización', 'automatizacion', 40, CURRENT_TIMESTAMP),
  ('pc_ia',             'IA',             'ia',             50, CURRENT_TIMESTAMP),
  ('pc_homelab',        'Homelab',        'homelab',        60, CURRENT_TIMESTAMP),
  ('pc_otros',          'Otros',          'otros',          70, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Semilla: clasificaciones usadas en proyectos existentes que no estén ya arriba.
-- El slug replica el `slugify` del API (sin acentos, minúsculas, guiones).
INSERT INTO "project_categories" ("id", "name", "slug", "position", "updated_at")
SELECT DISTINCT
  'pc_' || substr(md5(p."category"), 1, 20),
  p."category",
  trim(both '-' from regexp_replace(
    translate(lower(p."category"), 'áéíóúüñàèìòùâêîôûäëïöüç', 'aeiouunaeiouaeiouaeiouc'),
    '[^a-z0-9]+', '-', 'g'
  )),
  999,
  CURRENT_TIMESTAMP
FROM "projects" p
WHERE p."category" IS NOT NULL AND btrim(p."category") <> ''
ON CONFLICT DO NOTHING;

-- Enlazar proyectos existentes con su clasificación por nombre.
UPDATE "projects" p
SET "project_category_id" = pc."id"
FROM "project_categories" pc
WHERE p."category" = pc."name";

-- Renumerar clasificaciones: las más usadas primero (mismo orden que se veía antes:
-- "Software", "Web", … en el orden de la lista fija).
UPDATE "project_categories" pc
SET "position" = ranked.rn * 10
FROM (
  SELECT c.id, ROW_NUMBER() OVER (
    ORDER BY c."position" ASC, c."name" ASC
  ) AS rn
  FROM "project_categories" c
) AS ranked
WHERE pc.id = ranked.id;

-- Renumerar proyectos conservando el orden visible actual (destacados primero,
-- luego los actualizados más recientemente — el `orderBy` que tenía el API).
UPDATE "projects" p
SET "position" = ranked.rn * 10
FROM (
  SELECT id, ROW_NUMBER() OVER (
    ORDER BY "featured" DESC, "updated_at" DESC
  ) AS rn
  FROM "projects"
) AS ranked
WHERE p.id = ranked.id;

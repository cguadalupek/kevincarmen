-- Categorías principales dejan de ser un enum de PostgreSQL (que no se puede
-- ampliar en runtime) y pasan a ser una TABLA editable desde el CMS.
--
-- Orden de operaciones:
--   1. crear `main_categories` v sembrar las 4 por defecto (slug = token del enum
--      viejo, para conservar las URLs ya publicadas)
--   2. backfill: `main_category` (enum) -> `main_category_id` (FK) en posts y subs
--   3. imponer NOT NULL tras el backfill
--   4. nuevas FK + trigger de pertenencia (subcategoría debe ser de la principal)
--   5. limpiar: enum, FK compuesta vieja, taxi nominal plana legacy (`categories`)

-- 1. Categorías principales como tabla
CREATE TABLE "main_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "main_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "main_categories_slug_key" ON "main_categories"("slug");
-- CreateIndex
CREATE INDEX "main_categories_position_idx" ON "main_categories"("position");

-- Seed de las 4 categorías por defecto. slug = el token del enum antiguo.
INSERT INTO "main_categories" ("id", "slug", "name", "description", "position") VALUES
  ('maincatsoftwaredev000001', 'SOFTWARE_DEV',  'Software & Dev',    'Desarrollo de software, código, arquitectura y proyectos.', 1),
  ('maincatinfrahomelab000001','INFRA_HOMELAB', 'Infra & Homelab',   'Servidores, contenedores, despliegues, redes y seguridad.',2),
  ('maincatithardware00000001','IT_HARDWARE',   'IT & Hardware',     'Equipos, ensamblaje, mantenimiento y cableado.',            3),
  ('maincatiatech000000000001','IA_TECH',       'IA & Tech',         'IA local, herramientas de IA y experimentos.',               4)
ON CONFLICT ("slug") DO NOTHING;

-- 2. subcategorías: vínculo a la tabla nueva
ALTER TABLE "subcategories" ADD COLUMN "main_category_id" TEXT;

UPDATE "subcategories" s
SET "main_category_id" = m."id"
FROM "main_categories" m
WHERE m."slug" = s."main_category"::text;

-- 2. posts: vínculo a la tabla nueva
ALTER TABLE "posts" ADD COLUMN "main_category_id" TEXT;

UPDATE "posts" p
SET "main_category_id" = m."id"
FROM "main_categories" m
WHERE m."slug" = p."main_category"::text;

-- 3. obligatoria tras el backfill (si alguna fila quedara huérfana, aquí falla)
ALTER TABLE "subcategories" ALTER COLUMN "main_category_id" SET NOT NULL;
ALTER TABLE "posts" ALTER COLUMN "main_category_id" SET NOT NULL;

-- CreateIndex / CreateUniqueIndex nuevos
CREATE UNIQUE INDEX "subcategories_main_category_id_slug_key" ON "subcategories"("main_category_id", "slug");
CREATE INDEX "subcategories_main_category_id_position_idx" ON "subcategories"("main_category_id", "position");
CREATE INDEX "subcategories_slug_idx" ON "subcategories"("slug");
CREATE INDEX "posts_main_category_id_sub_category_id_idx" ON "posts"("main_category_id", "sub_category_id");

-- 4. FKs nuevas
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_main_category_id_fkey"
  FOREIGN KEY ("main_category_id") REFERENCES "main_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "posts" ADD CONSTRAINT "posts_main_category_id_fkey"
  FOREIGN KEY ("main_category_id") REFERENCES "main_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "posts" ADD CONSTRAINT "posts_sub_category_id_fkey"
  FOREIGN KEY ("sub_category_id") REFERENCES "subcategories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger: impide asignar a un post una subcategoría de OTRA categoría principal.
-- (La FK simple con MATCH SIMPLE no lo puede garantizar por sí sola.) Los triggers
-- son invisibles para `prisma migrate diff`, así que no causan drift.
CREATE OR REPLACE FUNCTION enforce_post_subcategory_parent() RETURNS trigger AS $$
BEGIN
  IF NEW."sub_category_id" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM "subcategories" s
      WHERE s."id" = NEW."sub_category_id"
        AND s."main_category_id" = NEW."main_category_id"
    ) THEN
      RAISE EXCEPTION 'sub_category_id % no pertenece a main_category_id %',
        NEW."sub_category_id", NEW."main_category_id";
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_subcategory_parent_trigger ON "posts";
CREATE TRIGGER posts_subcategory_parent_trigger
  BEFORE INSERT OR UPDATE OF "main_category_id", "sub_category_id" ON "posts"
  FOR EACH ROW EXECUTE FUNCTION enforce_post_subcategory_parent();

-- 5. Limpieza de la taxonomía enum + compuesta
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_sub_category_id_main_category_fkey";
DROP INDEX IF EXISTS "posts_main_category_sub_category_id_idx";
ALTER TABLE "posts" DROP COLUMN IF EXISTS "main_category";
ALTER TABLE "subcategories" DROP COLUMN IF EXISTS "main_category";
DROP INDEX IF EXISTS "subcategories_main_category_slug_key";
DROP INDEX IF EXISTS "subcategories_id_main_category_key";
DROP INDEX IF EXISTS "subcategories_main_category_position_idx";
DROP TYPE IF EXISTS "MainCategory";

-- 5b. Se elimina la taxonomía plana legacy (front-back de la primera migración).
-- La compatibilidad con los slugs antiguos (`?category=redes`) se mantiene a
-- nivel de aplicación, no de datos.
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_category_id_fkey";
DROP INDEX IF EXISTS "posts_category_id_idx";
ALTER TABLE "posts" DROP COLUMN IF EXISTS "category_id";
DROP TABLE IF EXISTS "categories";
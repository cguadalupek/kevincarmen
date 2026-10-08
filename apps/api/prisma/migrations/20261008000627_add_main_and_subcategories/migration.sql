-- Taxonomía de dos niveles para el blog: categoría principal (enum) + subcategoría (tabla).
--
-- Orden de operaciones deliberado: la columna `main_category` se crea NULLable, se
-- rellena con el mapeo de las categorías antiguas y solo entonces se aplica NOT NULL.
-- Un `ADD COLUMN ... NOT NULL` directo falla con las filas existentes.

-- CreateEnum
CREATE TYPE "MainCategory" AS ENUM ('SOFTWARE_DEV', 'INFRA_HOMELAB', 'IT_HARDWARE', 'IA_TECH');

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "main_category" "MainCategory" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_main_category_slug_key" ON "subcategories"("main_category", "slug");

-- CreateIndex: habilita la FK compuesta desde posts (id, main_category)
CREATE UNIQUE INDEX "subcategories_id_main_category_key" ON "subcategories"("id", "main_category");

-- CreateIndex
CREATE INDEX "subcategories_main_category_position_idx" ON "subcategories"("main_category", "position");

-- Seed de la taxonomía (12 subcategorías). IDs explícitos para que el backfill de
-- abajo sea determinista; el resto de la app no asume el formato de los ids.
INSERT INTO "subcategories" ("id", "slug", "name", "description", "main_category", "position") VALUES
  ('subsoftwaredev00000001', 'desarrollo-web-apps',      'Desarrollo Web & Apps',        'Frontend, backend, APIs y aplicaciones completas.',        'SOFTWARE_DEV',   1),
  ('subsoftwaredev00000002', 'proyectos-showcases',      'Proyectos & Showcases',        'Casos de estudio y presentación de proyectos.',             'SOFTWARE_DEV',   2),
  ('subsoftwaredev00000003', 'snippets-guias',           'Snippets & Guías',             'Fragmentos de código, recetas y guías cortas.',             'SOFTWARE_DEV',   3),
  ('subinfrahomelab00000001', 'servidores-homelab',      'Servidores & Homelab',         'Proxmox, virtualización, NAS y servicios autohospedados.',  'INFRA_HOMELAB',  1),
  ('subinfrahomelab00000002', 'docker-despliegues',      'Docker & Despliegues',         'Contenedores, Compose, CI/CD y puesta en producción.',      'INFRA_HOMELAB',  2),
  ('subinfrahomelab00000003', 'redes-seguridad',         'Redes & Seguridad',            'Conectividad, ruteo, firewall, VPN y hardening.',           'INFRA_HOMELAB',  3),
  ('subithardware000000001',  'hardware-ensamblaje',     'Hardware & Ensamblaje',        'Equipos, componentes, builds y rendimiento.',               'IT_HARDWARE',    1),
  ('subithardware000000002',  'soporte-mantenimiento',   'Soporte & Mantenimiento',      'Diagnóstico, reparación y mantenimiento de equipos.',       'IT_HARDWARE',    2),
  ('subithardware000000003',  'cableado-redes-fisicas',  'Cableado & Redes Físicas',     'Cableado estructurado, racks y montaje físico.',            'IT_HARDWARE',    3),
  ('subiatech00000000000001', 'ia-local-selfhosted',     'IA Local & Self-Hosted',       'Modelos ejecutados en tu propio hardware.',                 'IA_TECH',        1),
  ('subiatech00000000000002', 'ai-tooling-workflow',     'AI Tooling & Workflow',        'Herramientas de IA y cómo integrarlas en el flujo diario.', 'IA_TECH',        2),
  ('subiatech00000000000003', 'experimentos-fisica-tech','Experimentos & Física/Tech',   'Pruebas, experimentos y exploraciones técnicas.',           'IA_TECH',        3);

-- AlterTable: primero NULLable
ALTER TABLE "posts" ADD COLUMN "main_category" "MainCategory";
ALTER TABLE "posts" ADD COLUMN "sub_category_id" TEXT;

-- Backfill: cada categoría antigua se mapea a su par (principal, subcategoría).
-- `homelab` no existe en la BD (el frontend lo resolvía por nombre a 'Infraestructura'),
-- pero se incluye por si alguna instalación sí lo tiene.
UPDATE "posts" p
SET "main_category" = leg.main_category,
    "sub_category_id" = leg.sub_category_id
FROM (VALUES
  ('desarrollo',      'SOFTWARE_DEV'::"MainCategory",  'subsoftwaredev00000001'::text),
  ('infraestructura', 'INFRA_HOMELAB'::"MainCategory", 'subinfrahomelab00000001'::text),
  ('homelab',         'INFRA_HOMELAB'::"MainCategory", 'subinfrahomelab00000001'::text),
  ('redes',           'INFRA_HOMELAB'::"MainCategory", 'subinfrahomelab00000003'::text),
  ('hardware',        'IT_HARDWARE'::"MainCategory",   'subithardware000000001'::text),
  ('soporte-ti',      'IT_HARDWARE'::"MainCategory",   'subithardware000000002'::text),
  ('ia',              'IA_TECH'::"MainCategory",       'subiatech00000000000001'::text)
) AS leg(slug, main_category, sub_category_id)
JOIN "categories" c ON c."slug" = leg.slug
WHERE p."category_id" = c."id";

-- Los posts sin categoría antigua (o con una categoría no contemplada) reciben
-- INFRA_HOMELAB / Servidores & Homelab. Se avisa en el log para revisarlos en el CMS.
DO $$
DECLARE
  huerfanos int;
BEGIN
  SELECT count(*) INTO huerfanos FROM "posts" WHERE "main_category" IS NULL;
  IF huerfanos > 0 THEN
    RAISE NOTICE 'main_subcategories: % post(s) sin categoría legacy se asignaron a INFRA_HOMELAB / servidores-homelab. Revísalos en /admin/posts.', huerfanos;
  END IF;
END $$;

UPDATE "posts"
SET "main_category" = 'INFRA_HOMELAB',
    "sub_category_id" = 'subinfrahomelab00000001'
WHERE "main_category" IS NULL;

-- Ahora sí, obligatoria
ALTER TABLE "posts" ALTER COLUMN "main_category" SET NOT NULL;

-- CreateIndex
CREATE INDEX "posts_main_category_sub_category_id_idx" ON "posts"("main_category", "sub_category_id");

-- FK compuesta: hace imposible a nivel de motor guardar una subcategoría que no
-- pertenezca a la categoría principal del post. Si "sub_category_id" es NULL,
-- Postgres (MATCH SIMPLE) no evalúa la restricción → subcategoría opcional.
-- ON DELETE RESTRICT y no SET NULL: SET NULL intentaría anular `main_category`,
-- que es NOT NULL, y la operación fallaría.
ALTER TABLE "posts" ADD CONSTRAINT "posts_sub_category_id_main_category_fkey"
  FOREIGN KEY ("sub_category_id", "main_category")
  REFERENCES "subcategories"("id", "main_category")
  ON DELETE RESTRICT ON UPDATE CASCADE;

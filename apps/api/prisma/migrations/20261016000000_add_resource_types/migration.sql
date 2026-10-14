-- Tipos de recurso editables (Recursos › Tipos) + vínculo de cada recurso.
--
-- (1) `resource_types`: antes el «Tipo» del formulario era un enum fijo
--     (`ResourceType`: SCRIPT, TEMPLATE, …); ahora son filas de tabla, igual que
--     `project_categories` o las categorías del blog, para poder crear,
--     renombrar, reordenar y eliminar tipos desde el panel.
-- (2) `resources.resource_type_id`: FK a la tabla nueva. La columna ENUM `type` se
--     conserva (denormalizada) por compatibilidad con lo ya publicado y como
--     respaldo del listado público cuando un recurso aún no tiene tipo enlazado.
-- (3) Semilla: los siete valores del enum, con los rótulos que ya mostraba el sitio
--     (Script, Plantilla, Docker / Compose, Checklist, Guía / PDF, Dataset, Otro) y
--     su icono, más el enlace de los recursos existentes por su valor de enum.

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "resource_type_id" TEXT;

-- CreateTable
CREATE TABLE "resource_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'file',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_types_name_key" ON "resource_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resource_types_slug_key" ON "resource_types"("slug");

-- CreateIndex
CREATE INDEX "resource_types_position_idx" ON "resource_types"("position");

-- CreateIndex
CREATE INDEX "resources_resource_type_id_idx" ON "resources"("resource_type_id");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_resource_type_id_fkey" FOREIGN KEY ("resource_type_id") REFERENCES "resource_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Semilla: los tipos que traía el formulario (el CMS no arranca vacío).
INSERT INTO "resource_types" ("id", "name", "slug", "description", "icon", "position", "updated_at") VALUES
  ('rt_script',    'Script',           'script',    'Scripts sueltos (.sh, .py, .ps1) listos para ejecutar.',        'file-code',   10, CURRENT_TIMESTAMP),
  ('rt_plantilla', 'Plantilla',        'plantilla', 'Plantillas de configuración o de proyecto para adaptar.',       'file-text',   20, CURRENT_TIMESTAMP),
  ('rt_docker',    'Docker / Compose', 'docker',    'docker-compose.yml y despliegues con contenedores.',            'container',   30, CURRENT_TIMESTAMP),
  ('rt_checklist', 'Checklist',        'checklist', 'Listas de comprobación paso a paso.',                           'list-checks', 40, CURRENT_TIMESTAMP),
  ('rt_guia',      'Guía / PDF',       'guia',      'Documentos y guías en PDF.',                                    'book-open',   50, CURRENT_TIMESTAMP),
  ('rt_dataset',   'Dataset',          'dataset',   'Datos de ejemplo o de referencia.',                             'database',    60, CURRENT_TIMESTAMP),
  ('rt_otro',      'Otro',             'otro',      'Cualquier descarga que no encaja en los tipos anteriores.',     'file',        70, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Enlaza los recursos ya publicados con su tipo según el valor del enum legado.
UPDATE "resources" r
SET "resource_type_id" = m."type_id"
FROM (
  VALUES
    ('SCRIPT',    'rt_script'),
    ('TEMPLATE',  'rt_plantilla'),
    ('DOCKER',    'rt_docker'),
    ('CHECKLIST', 'rt_checklist'),
    ('GUIDE',     'rt_guia'),
    ('DATASET',   'rt_dataset'),
    ('OTHER',     'rt_otro')
) AS m(legacy, type_id)
WHERE r."type"::text = m.legacy;

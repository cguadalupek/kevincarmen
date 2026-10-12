-- Lab: contenido enriquecido (Markdown) + video largo + capítulos + visibilidad
ALTER TABLE "lab_services"
  ADD COLUMN "chapters" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "content" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reading_time" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "video_duration" INTEGER,
  ADD COLUMN "video_url" TEXT;

-- Backfill: el contenido que antes vivía en campos sueltos pasa a un cuerpo
-- Markdown (los campos legacy se conservan para la ficha rápida del CMS).
UPDATE "lab_services" SET "content" = trim(concat_ws(E'\n\n',
  CASE WHEN coalesce(trim("environment"), '') <> '' THEN '## Entorno\n\n' || "environment" END,
  CASE WHEN coalesce(trim("procedure"), '') <> '' THEN '## Procedimiento\n\n' || "procedure" END,
  CASE WHEN coalesce(trim("result"), '') <> '' THEN '## Resultado\n\n' || "result" END
)) WHERE "content" = '';

-- Los experimentos existentes ya estaban visibles en /lab.
UPDATE "lab_services" SET "published" = true;

-- Recursos descargables
CREATE TYPE "ResourceType" AS ENUM ('SCRIPT', 'TEMPLATE', 'DOCKER', 'CHECKLIST', 'GUIDE', 'DATASET', 'OTHER');

CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'OTHER',
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "version" TEXT,
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");
CREATE INDEX "resources_published_position_idx" ON "resources"("published", "position");
CREATE INDEX "lab_services_published_started_at_idx" ON "lab_services"("published", "started_at");
CREATE TYPE "ExperimentStatus" AS ENUM ('IN_PROGRESS', 'SUCCESS', 'PARTIAL', 'FAILED', 'ABANDONED');

ALTER TABLE "lab_services"
  ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "objective" TEXT,
  ADD COLUMN "hypothesis" TEXT,
  ADD COLUMN "environment" TEXT,
  ADD COLUMN "procedure" TEXT,
  ADD COLUMN "result" TEXT,
  ADD COLUMN "conclusion" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "cover_image" TEXT,
  ADD COLUMN "gallery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "started_at" TIMESTAMP(3),
  ADD COLUMN "completed_at" TIMESTAMP(3),
  ADD COLUMN "related_post_id" TEXT,
  ADD COLUMN "related_project_id" TEXT;

UPDATE "lab_services" SET "title" = "name" WHERE "title" = '';
ALTER TABLE "lab_services" ADD COLUMN "status_new" "ExperimentStatus" NOT NULL DEFAULT 'IN_PROGRESS';
UPDATE "lab_services" SET "status_new" = CASE "status"::TEXT
  WHEN 'ONLINE' THEN 'SUCCESS'
  WHEN 'MAINTENANCE' THEN 'PARTIAL'
  ELSE 'ABANDONED'
END::"ExperimentStatus";

ALTER TABLE "lab_services" DROP COLUMN "status";
ALTER TABLE "lab_services" RENAME COLUMN "status_new" TO "status";

DROP TYPE "LabStatus";
CREATE INDEX "lab_services_status_created_at_idx" ON "lab_services"("status", "created_at");

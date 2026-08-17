-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('EDUCATION', 'WORK', 'PROJECT', 'ACHIEVEMENT');

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL DEFAULT 'PROJECT',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_events_position_created_at_idx" ON "timeline_events"("position", "created_at");
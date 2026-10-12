-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'ARTICLE', 'PRACTICE', 'QUIZ');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "subtitle" TEXT,
ADD COLUMN "learning_points" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "target_audience" TEXT;

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "LessonType" NOT NULL DEFAULT 'VIDEO',
    "video_url" TEXT,
    "video_type" "VideoType" NOT NULL DEFAULT 'YOUTUBE',
    "content" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "resources" JSONB,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_modules_course_id_position_idx" ON "course_modules"("course_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_module_id_slug_key" ON "lessons"("module_id", "slug");

-- CreateIndex
CREATE INDEX "lessons_module_id_position_idx" ON "lessons"("module_id", "position");

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

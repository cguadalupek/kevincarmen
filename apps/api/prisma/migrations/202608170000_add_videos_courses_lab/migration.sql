-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "CourseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('COMING_SOON', 'AVAILABLE', 'IN_PROGRESS', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "VideoType" ADD VALUE 'ODYSEE';

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "videoType" "VideoType" NOT NULL DEFAULT 'YOUTUBE',
    "thumbnail" TEXT,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "CourseDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "duration" TEXT NOT NULL,
    "lessonsCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseStatus" NOT NULL DEFAULT 'COMING_SOON',
    "coverImage" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stack" TEXT[],
    "icon" TEXT,
    "status" "LabStatus" NOT NULL DEFAULT 'ONLINE',
    "url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "videos_featured_position_idx" ON "videos"("featured", "position");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_position_idx" ON "courses"("status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lab_services_slug_key" ON "lab_services"("slug");

-- CreateIndex
CREATE INDEX "lab_services_status_position_idx" ON "lab_services"("status", "position");
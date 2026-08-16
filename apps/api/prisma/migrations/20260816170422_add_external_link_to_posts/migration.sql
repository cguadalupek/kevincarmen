-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('YOUTUBE', 'YOUTUBE_SHORT', 'TIKTOK', 'TWITTER', 'VIMEO', 'GENERIC');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "external_link_label" TEXT,
ADD COLUMN     "external_link_url" TEXT,
ADD COLUMN     "video_type" "VideoType",
ADD COLUMN     "video_url" TEXT;

-- CreateIndex
CREATE INDEX "posts_category_id_idx" ON "posts"("category_id");

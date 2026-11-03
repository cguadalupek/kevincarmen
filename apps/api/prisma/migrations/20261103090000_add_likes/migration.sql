-- CreateEnum
CREATE TYPE "LikeEntity" AS ENUM ('POST', 'PROJECT');

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "entity" "LikeEntity" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "likes_entity_entity_id_idx" ON "likes"("entity", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_entity_entity_id_visitor_id_key" ON "likes"("entity", "entity_id", "visitor_id");

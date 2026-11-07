-- Progreso de cursos de los estudiantes registrados.
-- Los invitados no escriben aquí: su avance vive en el localStorage del navegador
-- y se sincroniza al crear cuenta (POST /progress/sync).

-- CreateTable
CREATE TABLE "course_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: una fila por usuario y capítulo (marcar dos veces no duplica).
CREATE UNIQUE INDEX "course_progress_user_id_course_id_chapter_id_key" ON "course_progress"("user_id", "course_id", "chapter_id");

-- CreateIndex: agregados del panel («capítulos más completados»).
CREATE INDEX "course_progress_course_id_chapter_id_idx" ON "course_progress"("course_id", "chapter_id");

-- CreateIndex: progreso propio y actividad reciente.
CREATE INDEX "course_progress_user_id_updated_at_idx" ON "course_progress"("user_id", "updated_at");

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

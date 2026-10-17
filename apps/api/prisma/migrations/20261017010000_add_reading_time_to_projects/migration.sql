-- Tiempo de lectura estimado (minutos) de un proyecto.
-- Opcional: los proyectos existentes quedan en NULL y la web calcula el valor.
ALTER TABLE "projects" ADD COLUMN "reading_time" INTEGER;

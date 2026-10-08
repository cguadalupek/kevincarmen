-- Color del badge de la categoría: clave de la paleta del frontend
-- (emerald, cyan, amber, ...). Aditivo: solo agrega la columna con default.
ALTER TABLE "main_categories" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'emerald';

-- Las 4 categorías por defecto conservan su color original.
UPDATE "main_categories" SET "color" = 'emerald' WHERE "slug" = 'SOFTWARE_DEV';
UPDATE "main_categories" SET "color" = 'cyan'    WHERE "slug" = 'INFRA_HOMELAB';
UPDATE "main_categories" SET "color" = 'amber'   WHERE "slug" = 'IT_HARDWARE';
UPDATE "main_categories" SET "color" = 'violet'  WHERE "slug" = 'IA_TECH';
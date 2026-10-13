-- CreateTable
CREATE TABLE "tech_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tech_categories_position_idx" ON "tech_categories"("position");

-- CreateIndex
CREATE INDEX "tech_items_category_id_position_idx" ON "tech_items"("category_id", "position");

-- AddForeignKey
ALTER TABLE "tech_items" ADD CONSTRAINT "tech_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tech_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: categorías del stack actual (estado previo hardcodeado en @kevincarmen/config).
INSERT INTO "tech_categories" ("id", "name", "position", "updated_at") VALUES
  ('cat-frontend', 'FRONTEND', 0, NOW()),
  ('cat-backend', 'BACKEND', 1, NOW()),
  ('cat-devops', 'DEVOPS', 2, NOW()),
  ('cat-infra', 'INFRAESTRUCTURA', 3, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed: ítems de cada categoría (mismos nombres que techStack, mismo orden).
INSERT INTO "tech_items" ("id", "category_id", "name", "position", "updated_at") VALUES
  ('itm-nextjs', 'cat-frontend', 'Next.js', 0, NOW()),
  ('itm-react', 'cat-frontend', 'React', 1, NOW()),
  ('itm-typescript', 'cat-frontend', 'TypeScript', 2, NOW()),
  ('itm-tailwind', 'cat-frontend', 'Tailwind CSS', 3, NOW()),
  ('itm-nestjs', 'cat-backend', 'NestJS', 0, NOW()),
  ('itm-postgresql', 'cat-backend', 'PostgreSQL', 1, NOW()),
  ('itm-prisma', 'cat-backend', 'Prisma', 2, NOW()),
  ('itm-redis', 'cat-backend', 'Redis', 3, NOW()),
  ('itm-docker', 'cat-devops', 'Docker', 0, NOW()),
  ('itm-linux', 'cat-devops', 'Linux', 1, NOW()),
  ('itm-nginx', 'cat-devops', 'Nginx', 2, NOW()),
  ('itm-cloudflare', 'cat-devops', 'Cloudflare', 3, NOW()),
  ('itm-github-actions', 'cat-devops', 'GitHub Actions', 4, NOW()),
  ('itm-proxmox', 'cat-infra', 'Proxmox', 0, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed: contenido por defecto del hero y "Sobre mí" (equivalente al sitio estático actual).
INSERT INTO "settings" ("id", "key", "value") VALUES
  (gen_random_uuid()::text, 'hero.name', 'Kevin Carmen'),
  (gen_random_uuid()::text, 'hero.tagline', 'Aprendo • Enseño • Creo • Construyo'),
  (gen_random_uuid()::text, 'hero.roles', '["Profesor de Computación","Analista TI","Administrador de Servidores","Desarrollador","Creador de Contenido","Entusiasta Open Source"]'),
  (gen_random_uuid()::text, 'hero.description', 'Desarrollo software, administro infraestructura, enseño tecnología y creo contenido. Construyendo soluciones que escalan.'),
  (gen_random_uuid()::text, 'about.bio', '["Soy profesor de computación, analista TI, administrador de servidores y desarrollador. Me apasiona la tecnología en todas sus formas: desde escribir código hasta montar infraestructura self-hosted en mi homelab.","Creo contenido educativo en YouTube y TikTok, comparto recursos open source y construyo herramientas que resuelven problemas reales. Esta plataforma es mi ecosistema personal: un lugar donde convergen mi blog, portfolio, laboratorio y formación."]'),
  (gen_random_uuid()::text, 'about.expertise', '["Next.js","React","TypeScript","Tailwind CSS","NestJS","PostgreSQL","Prisma","Redis","Docker","Linux","Nginx","Cloudflare","GitHub Actions","Proxmox"]'),
  (gen_random_uuid()::text, 'about.now_title', 'Lo que estoy haciendo ahora'),
  (gen_random_uuid()::text, 'about.now_items', '["Desarrollando KevinCarmen.xyz con CMS, blog, portfolio y homelab.","Creando contenido sobre homelab, Docker y administración de servidores.","Preparando material para un curso de Next.js Full Stack."]')
ON CONFLICT ("key") DO NOTHING;
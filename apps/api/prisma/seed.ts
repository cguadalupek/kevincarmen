import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrador del CMS',
      permissions: {
        create: [
          { action: 'manage', resource: 'posts' },
          { action: 'manage', resource: 'pages' },
          { action: 'manage', resource: 'media' },
        ],
      },
    },
  });

  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? 'Admin123!',
    10,
  );

  await prisma.user.upsert({
    where: { email: 'admin@kevincarmen.xyz' },
    update: {},
    create: {
      email: 'admin@kevincarmen.xyz',
      passwordHash,
      name: 'Kevin Carmen',
      roleId: adminRole.id,
    },
  });

  console.log('Seed completado: admin@kevincarmen.xyz');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

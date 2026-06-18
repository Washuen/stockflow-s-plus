const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const OWNER_EMAIL = 'owner@stockflow.dev';
const LEGACY_EMAIL = 'admin@stockflow.dev';
const DEMO_PASSWORD = '123456';

async function findOrCreateCompany() {
  let company = await prisma.company.findFirst({
    where: { OR: [{ document: '00000000000100' }, { name: 'StockFlow Demo Company' }] }
  });

  if (!company) {
    company = await prisma.company.create({
      data: { name: 'StockFlow Demo Company', document: '00000000000100' }
    });
  }

  return company;
}

async function main() {
  const company = await findOrCreateCompany();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      name: 'Owner StockFlow',
      role: 'OWNER',
      isActive: true,
      deletedAt: null,
      companyId: company.id,
      passwordHash
    },
    create: {
      name: 'Owner StockFlow',
      email: OWNER_EMAIL,
      role: 'OWNER',
      isActive: true,
      companyId: company.id,
      passwordHash
    }
  });

  const legacy = await prisma.user.findUnique({ where: { email: LEGACY_EMAIL } });

  if (legacy && legacy.id !== owner.id) {
    await prisma.user.update({
      where: { id: legacy.id },
      data: {
        name: 'Owner StockFlow (legado desativado)',
        role: 'ADMIN',
        isActive: false,
        deletedAt: new Date()
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      action: 'OWNER_CONSOLIDATED',
      entity: 'User',
      entityId: owner.id,
      userId: owner.id,
      companyId: company.id,
      metadata: {
        module: 'Usuários',
        details: 'Owner oficial consolidado. Conta admin legada desativada para evitar duplicidade.',
        ownerEmail: OWNER_EMAIL,
        legacyEmail: LEGACY_EMAIL
      }
    }
  }).catch(error => console.warn('[audit warning]', error.message));

  console.log('Owner oficial consolidado com sucesso.');
  console.log(`Login: ${OWNER_EMAIL}`);
  console.log(`Senha: ${DEMO_PASSWORD}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

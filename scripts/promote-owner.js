const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_PASSWORD = '123456';
const OWNER_EMAIL = 'owner@stockflow.dev';
const LEGACY_EMAIL = 'admin@stockflow.dev';

async function findOrCreateCompany() {
  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { document: '00000000000100' },
        { name: 'StockFlow Demo Company' }
      ]
    }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'StockFlow Demo Company',
        document: '00000000000100'
      }
    });
  }

  return company;
}

async function upsertOwner(email, companyId) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: 'Owner StockFlow',
        role: 'OWNER',
        isActive: true,
        companyId,
        passwordHash
      }
    });
  }

  return prisma.user.create({
    data: {
      name: 'Owner StockFlow',
      email,
      role: 'OWNER',
      isActive: true,
      companyId,
      passwordHash
    }
  });
}

async function main() {
  const company = await findOrCreateCompany();

  const owner = await upsertOwner(OWNER_EMAIL, company.id);
  await upsertOwner(LEGACY_EMAIL, company.id);

  console.log(`Owner oficial pronto: ${owner.email}`);
  console.log(`Login legado também ativo: ${LEGACY_EMAIL}`);
  console.log(`Senha: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

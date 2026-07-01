const bcrypt = require('bcryptjs');
const { prisma } = require('../src/config/prisma');

const DEMO_PASSWORD = '123456';

const DEMO_USERS = [
  {
    email: 'owner@stockflow.dev',
    name: 'Owner StockFlow',
    role: 'OWNER'
  },
  {
    email: 'admin@stockflow.dev',
    name: 'Administrator StockFlow',
    role: 'ADMIN'
  },
  {
    email: 'gerente@stockflow.dev',
    name: 'Gerente Operacional',
    role: 'MANAGER'
  },
  {
    email: 'estoque@stockflow.dev',
    name: 'Estoquista',
    role: 'STOCK'
  },
  {
    email: 'vendas@stockflow.dev',
    name: 'Vendedor',
    role: 'SALES'
  },
  {
    email: 'financeiro@stockflow.dev',
    name: 'Financeiro',
    role: 'FINANCE'
  }
];

async function findOrCreateDemoCompany() {
  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { document: '00000000000100' },
        { document: '00.000.000/0001-00' },
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
  } else {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: 'StockFlow Demo Company'
      }
    });
  }

  return company;
}

async function upsertDemoUser(companyId, demoUser) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: demoUser.email
    }
  });

  if (existingUser) {
    return prisma.user.update({
      where: {
        email: demoUser.email
      },
      data: {
        name: demoUser.name,
        role: demoUser.role,
        isActive: true,
        deletedAt: null,
        companyId,
        passwordHash
      }
    });
  }

  return prisma.user.create({
    data: {
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      isActive: true,
      deletedAt: null,
      companyId,
      passwordHash
    }
  });
}

async function main() {
  console.log('Normalizando usuários demo do StockFlow...');

  const company = await findOrCreateDemoCompany();

  const demoEmails = DEMO_USERS.map((user) => user.email);

  for (const demoUser of DEMO_USERS) {
    const user = await upsertDemoUser(company.id, demoUser);
    console.log(`OK: ${user.name} | ${user.email} | ${user.role}`);
  }

  const deleted = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: demoEmails
      }
    }
  });

  console.log(`Usuários fora da base demo removidos: ${deleted.count}`);
  console.log('Normalização concluída com sucesso.');
  console.log(`Senha demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Erro ao normalizar usuários demo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
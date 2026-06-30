const { prisma } = require('../src/config/prisma');

const DEMO_USERS = [
  {
    email: 'owner@stockflow.dev',
    name: 'Owner StockFlow',
    role: 'OWNER',
    isActive: true,
    deletedAt: null
  },
  {
    email: 'admin@stockflow.dev',
    name: 'Administrator StockFlow',
    role: 'ADMIN',
    isActive: true,
    deletedAt: null
  },
  {
    email: 'gerente@stockflow.dev',
    name: 'Gerente Operacional',
    role: 'MANAGER',
    isActive: true,
    deletedAt: null
  },
  {
    email: 'estoque@stockflow.dev',
    name: 'Estoquista',
    role: 'STOCK',
    isActive: true,
    deletedAt: null
  },
  {
    email: 'vendas@stockflow.dev',
    name: 'Vendedor',
    role: 'SALES',
    isActive: true,
    deletedAt: null
  },
  {
    email: 'financeiro@stockflow.dev',
    name: 'Financeiro',
    role: 'FINANCE',
    isActive: true,
    deletedAt: null
  }
];

async function main() {
  console.log('Normalizando usuários demo do StockFlow...');

  const demoEmails = DEMO_USERS.map((user) => user.email);

  for (const demoUser of DEMO_USERS) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: demoUser.email
      }
    });

    if (!existingUser) {
      console.log(`Usuário não encontrado, ignorado: ${demoUser.email}`);
      continue;
    }

    const updated = await prisma.user.update({
      where: {
        email: demoUser.email
      },
      data: {
        name: demoUser.name,
        role: demoUser.role,
        isActive: demoUser.isActive,
        deletedAt: demoUser.deletedAt
      }
    });

    console.log(`Atualizado: ${updated.name} | ${updated.email} | ${updated.role}`);
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
}

main()
  .catch((error) => {
    console.error('Erro ao normalizar usuários demo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
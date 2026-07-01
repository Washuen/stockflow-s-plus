const { prisma } = require('../src/config/prisma');

async function main() {
  const admin = await prisma.user.findUnique({
    where: {
      email: 'admin@stockflow.dev'
    }
  });

  if (!admin) {
    console.log('Usuário admin@stockflow.dev não encontrado.');
    return;
  }

  const updated = await prisma.user.update({
    where: {
      email: 'admin@stockflow.dev'
    },
    data: {
      name: 'Administrator StockFlow',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('Usuário admin corrigido com sucesso:');
  console.log({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive
  });
}

main()
  .catch((error) => {
    console.error('Erro ao corrigir usuário admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
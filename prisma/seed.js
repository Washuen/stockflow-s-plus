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
  } else {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: 'StockFlow Demo Company',
        document: company.document || '00000000000100'
      }
    });
  }

  return company;
}

async function upsertUserByEmail({ email, name, companyId, role = 'OWNER' }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role,
        isActive: true,
        companyId,
        passwordHash
      }
    });
  }

  return prisma.user.create({
    data: {
      name,
      email,
      role,
      isActive: true,
      companyId,
      passwordHash
    }
  });
}

async function upsertCategory(name, companyId) {
  const existing = await prisma.category.findFirst({
    where: { name, companyId }
  });

  if (existing) return existing;

  return prisma.category.create({
    data: { name, companyId }
  });
}

async function upsertSupplier(companyId) {
  const existing = await prisma.supplier.findFirst({
    where: {
      name: 'Fornecedor Tech Prime',
      companyId
    }
  });

  if (existing) return existing;

return prisma.supplier.create({
  data: {
    name: 'Fornecedor Tech Prime',
    document: 'SUP-TECH-PRIME',
    companyId
  }
});
}

async function upsertProduct(item, companyId, categoryId, supplierId) {
  const existing = await prisma.product.findFirst({
    where: {
      sku: item.sku,
      companyId
    }
  });

  const data = {
    name: item.name,
    sku: item.sku,
    price: item.price,
    cost: item.cost,
    stock: item.stock,
    minStock: item.minStock,
    status: 'ACTIVE',
    companyId,
    categoryId,
    supplierId
  };

  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.product.create({ data });
}

async function main() {
  console.log('Seeding StockFlow database...');

  const company = await findOrCreateCompany();

  const owner = await upsertUserByEmail({
    email: OWNER_EMAIL,
    name: 'Owner StockFlow',
    companyId: company.id,
    role: 'OWNER'
  });

  await upsertUserByEmail({
    email: LEGACY_EMAIL,
    name: 'Owner StockFlow',
    companyId: company.id,
    role: 'OWNER'
  });

  const categoryNames = [
    'Notebooks',
    'Monitores',
    'Armazenamento',
    'Periféricos',
    'Acessórios'
  ];

  const categoryMap = {};
  for (const name of categoryNames) {
    categoryMap[name] = await upsertCategory(name, company.id);
  }

  const supplier = await upsertSupplier(company.id);

  const products = [
    {
      name: 'Notebook Dell Inspiron',
      sku: 'NOTE-DELL-001',
      price: 3499.90,
      cost: 2780.00,
      stock: 18,
      minStock: 5,
      category: 'Notebooks'
    },
    {
      name: 'SSD NVMe 1TB Kingston',
      sku: 'SSD-KING-1TB',
      price: 379.90,
      cost: 260.00,
      stock: 6,
      minStock: 20,
      category: 'Armazenamento'
    },
    {
      name: 'Monitor 24 IPS',
      sku: 'MON-24-IPS',
      price: 889.90,
      cost: 650.00,
      stock: 3,
      minStock: 10,
      category: 'Monitores'
    },
    {
      name: 'Mouse Logitech MX Master',
      sku: 'MOU-MX-MASTER',
      price: 439.90,
      cost: 290.00,
      stock: 4,
      minStock: 12,
      category: 'Periféricos'
    },
    {
      name: 'Teclado Mecânico RGB',
      sku: 'TEC-RGB-001',
      price: 329.90,
      cost: 210.00,
      stock: 24,
      minStock: 8,
      category: 'Periféricos'
    },
    {
      name: 'Hub USB-C 7 em 1',
      sku: 'HUB-USBC-7',
      price: 169.90,
      cost: 99.00,
      stock: 96,
      minStock: 15,
      category: 'Acessórios'
    }
  ];

  const productMap = {};
  for (const item of products) {
    const product = await upsertProduct(
      item,
      company.id,
      categoryMap[item.category].id,
      supplier.id
    );
    productMap[item.sku] = product;
  }

  const existingExpenses = await prisma.expense.count({
    where: { companyId: company.id }
  });

  if (existingExpenses === 0) {
    await prisma.expense.createMany({
      data: [
        {
          description: 'Compra de mercadorias',
          category: 'Compras',
          amount: 1250.00,
          status: 'PAID',
          paidAt: new Date(),
          companyId: company.id,
          userId: owner.id
        },
        {
          description: 'Assinatura software fiscal',
          category: 'Assinaturas',
          amount: 189.90,
          status: 'PENDING',
          companyId: company.id,
          userId: owner.id
        }
      ]
    });
  }

  const existingSales = await prisma.sale.count({
    where: { companyId: company.id }
  });

  if (existingSales === 0 && productMap['NOTE-DELL-001']) {
    await prisma.sale.create({
      data: {
        customerName: 'Cliente Demo',
        status: 'PAID',
        subtotal: 3499.90,
        discount: 0,
        total: 3499.90,
        companyId: company.id,
        userId: owner.id,
        items: {
          create: [
            {
              productId: productMap['NOTE-DELL-001'].id,
              quantity: 1,
              unitPrice: 3499.90,
              unitCost: 2780.00,
              total: 3499.90
            }
          ]
        }
      }
    });
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_SEEDED',
        entity: 'System',
        entityId: company.id,
        companyId: company.id,
        userId: owner.id,
        metadata: {
          message: 'Seed compatível com schema real executado',
          ownerEmail: OWNER_EMAIL,
          legacyEmail: LEGACY_EMAIL,
          demoPassword: DEMO_PASSWORD
        }
      }
    });
  } catch (error) {
    console.warn('[Seed audit warning]', error.message);
  }

  console.log('Seed completed.');
  console.log(`Demo owner: ${OWNER_EMAIL}`);
  console.log(`Legacy login also active: ${LEGACY_EMAIL}`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

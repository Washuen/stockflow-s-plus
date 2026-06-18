const { prisma } = require('../config/prisma');

async function listProducts(companyId, filters = {}) {
  const { search, status, stockStatus, categoryId } = filters;

  return prisma.product.findMany({
    where: {
      companyId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(stockStatus === 'critical' ? { stock: { lte: prisma.product.fields.minStock } } : {})
    },
    include: {
      category: true,
      supplier: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getProduct(companyId, id) {
  const product = await prisma.product.findFirst({
    where: { id, companyId },
    include: { category: true, supplier: true }
  });

  if (!product) {
    const error = new Error('Produto não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function createProduct(companyId, data) {
  return prisma.product.create({
    data: {
      ...data,
      companyId,
      status: data.status || 'ACTIVE'
    }
  });
}

async function updateProduct(companyId, id, data) {
  await getProduct(companyId, id);

  return prisma.product.update({
    where: { id },
    data
  });
}

async function deleteProduct(companyId, id) {
  await getProduct(companyId, id);

  return prisma.product.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });
}

async function reactivateProduct(companyId, userId, id) {
  const product = await prisma.product.findFirst({
    where: { id, companyId }
  });

  if (!product) {
    const error = new Error('Produto não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const status = product.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';

  const updated = await prisma.product.update({
    where: { id },
    data: { status }
  });

  try {
    await prisma.auditLog.create({
      data: {
        action: 'PRODUCT_REACTIVATED',
        entity: 'Product',
        entityId: id,
        userId,
        companyId,
        metadata: {
          name: product.name,
          previousStatus: product.status,
          newStatus: status,
          stock: product.stock,
          reactivatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.warn('[StockFlow Audit Warning]', error.message);
  }

  return updated;
}

module.exports = {
  reactivateProduct,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};

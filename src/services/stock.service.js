const { prisma } = require('../config/prisma');

async function listMovements(companyId) {
  return prisma.stockMovement.findMany({
    where: { companyId },
    include: {
      product: true,
      user: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function registerMovement(companyId, userId, data) {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, companyId }
  });

  if (!product) {
    const error = new Error('Produto não encontrado');
    error.statusCode = 404;
    throw error;
  }

  if ((data.type === 'OUT' || data.type === 'ADJUSTMENT') && product.stock < data.quantity) {
    const error = new Error('Estoque insuficiente para movimentação');
    error.statusCode = 400;
    throw error;
  }

  const newStock =
    data.type === 'IN'
      ? product.stock + data.quantity
      : product.stock - data.quantity;

  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        productId: data.productId,
        userId,
        companyId
      }
    });

    await tx.product.update({
      where: { id: data.productId },
      data: {
        stock: newStock,
        status: newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
      }
    });

    await tx.auditLog.create({
      data: {
        action: 'STOCK_MOVEMENT_CREATED',
        entity: 'StockMovement',
        entityId: movement.id,
        userId,
        companyId,
        metadata: {
          productId: data.productId,
          type: data.type,
          quantity: data.quantity
        }
      }
    });

    return movement;
  });
}

module.exports = {
  listMovements,
  registerMovement
};

const { prisma } = require('../config/prisma');

async function listSales(companyId) {
  return prisma.sale.findMany({
    where: { companyId },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function createSale(companyId, userId, data) {
  const productIds = data.items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      companyId,
      status: 'ACTIVE'
    }
  });

  if (products.length !== productIds.length) {
    const error = new Error('Um ou mais produtos não foram encontrados ou estão inativos');
    error.statusCode = 400;
    throw error;
  }

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || product.stock < item.quantity) {
      const error = new Error(`Estoque insuficiente para ${product?.name || 'produto'}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const saleItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = Number(product.price);
    const unitCost = Number(product.cost);
    return {
      product,
      quantity: item.quantity,
      unitPrice,
      unitCost,
      total: unitPrice * item.quantity
    };
  });

  const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
  const discount = data.discount || 0;
  const total = Math.max(subtotal - discount, 0);

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        customerName: data.customerName,
        status: 'PAID',
        subtotal,
        discount,
        total,
        userId,
        companyId,
        items: {
          create: saleItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            total: item.total
          }))
        }
      },
      include: { items: true }
    });

    for (const item of saleItems) {
      const newStock = item.product.stock - item.quantity;

      await tx.product.update({
        where: { id: item.product.id },
        data: {
          stock: newStock,
          status: newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
        }
      });

      await tx.stockMovement.create({
        data: {
          type: 'SALE',
          quantity: item.quantity,
          reason: `Venda ${sale.id}`,
          productId: item.product.id,
          userId,
          companyId
        }
      });
    }

    await tx.auditLog.create({
      data: {
        action: 'SALE_CREATED',
        entity: 'Sale',
        entityId: sale.id,
        userId,
        companyId,
        metadata: { total, items: data.items }
      }
    });

    return sale;
  });
}

async function cancelSale(companyId, userId, saleId, reason = 'Cancelamento operacional') {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    include: { items: true }
  });

  if (!sale) {
    const error = new Error('Venda não encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (sale.status === 'CANCELED') {
    const error = new Error('Venda já está cancelada');
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      const productBefore = await tx.product.findUnique({ where: { id: item.productId } });
      const restoredStock = (productBefore?.stock || 0) + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: restoredStock,
          status: restoredStock > 0 ? 'ACTIVE' : productBefore?.status
        }
      });

      await tx.stockMovement.create({
        data: {
          type: 'ADJUSTMENT',
          quantity: item.quantity,
          reason: `Estorno por cancelamento da venda ${sale.id}`,
          productId: item.productId,
          userId,
          companyId
        }
      });
    }

    const canceledSale = await tx.sale.update({
      where: { id: saleId },
      data: { status: 'CANCELED' },
      include: { items: { include: { product: true } } }
    });

    await tx.auditLog.create({
      data: {
        action: 'SALE_CANCELED',
        entity: 'Sale',
        entityId: saleId,
        userId,
        companyId,
        metadata: {
          total: Number(sale.total),
          reason,
          canceledAt: new Date().toISOString(),
          restoredItems: sale.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        }
      }
    });

    return canceledSale;
  });
}

async function reactivateSale(companyId, userId, saleId, reason = 'Reativação operacional') {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    include: { items: true }
  });

  if (!sale) {
    const error = new Error('Venda não encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (sale.status !== 'CANCELED') {
    const error = new Error('Apenas vendas canceladas podem ser reativadas');
    error.statusCode = 400;
    throw error;
  }

  for (const item of sale.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.stock < item.quantity) {
      const error = new Error(`Estoque insuficiente para reativar a venda no produto ${product?.name || item.productId}`);
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      const productBefore = await tx.product.findUnique({ where: { id: item.productId } });
      const newStock = productBefore.stock - item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          status: newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
        }
      });

      await tx.stockMovement.create({
        data: {
          type: 'SALE',
          quantity: item.quantity,
          reason: `Reativação da venda ${sale.id}`,
          productId: item.productId,
          userId,
          companyId
        }
      });
    }

    const reactivatedSale = await tx.sale.update({
      where: { id: saleId },
      data: { status: 'PAID' },
      include: { items: { include: { product: true } } }
    });

    await tx.auditLog.create({
      data: {
        action: 'SALE_REACTIVATED',
        entity: 'Sale',
        entityId: saleId,
        userId,
        companyId,
        metadata: {
          total: Number(sale.total),
          reason,
          reactivatedAt: new Date().toISOString()
        }
      }
    });

    return reactivatedSale;
  });
}

module.exports = {
  listSales,
  createSale,
  cancelSale,
  reactivateSale
};

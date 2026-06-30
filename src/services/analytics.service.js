const { prisma } = require('../config/prisma');
const { toNumber, calculateMargin } = require('../utils/money');

function parseDate(value, fieldName, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} inválida`);
    error.statusCode = 400;
    throw error;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function buildDateFilter(filters = {}) {
  const startDate = parseDate(filters.startDate, 'startDate');
  const endDate = parseDate(filters.endDate, 'endDate', true);

  if (startDate && endDate && startDate > endDate) {
    const error = new Error('startDate não pode ser maior que endDate');
    error.statusCode = 400;
    throw error;
  }

  const createdAt = {};

  if (startDate) {
    createdAt.gte = startDate;
  }

  if (endDate) {
    createdAt.lte = endDate;
  }

  if (Object.keys(createdAt).length === 0) {
    return {};
  }

  return { createdAt };
}

function buildAppliedFilters(filters = {}) {
  return {
    startDate: filters.startDate || null,
    endDate: filters.endDate || null
  };
}

async function getKpis(companyId, filters = {}) {
  const dateFilter = buildDateFilter(filters);

  const [
    products,
    sales,
    expenses,
    users,
    suppliers
  ] = await Promise.all([
    prisma.product.findMany({ where: { companyId } }),
    prisma.sale.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    }),
    prisma.expense.findMany({
      where: {
        companyId,
        ...dateFilter
      }
    }),
    prisma.user.findMany({ where: { companyId } }),
    prisma.supplier.findMany({ where: { companyId } })
  ]);

  const activeProducts = products.filter((product) => product.status === 'ACTIVE');
  const criticalProducts = products.filter(
    (product) => product.status === 'ACTIVE' && product.stock <= product.minStock
  );

  const validSales = sales.filter((sale) => sale.status !== 'CANCELED');
  const canceledSales = sales.filter((sale) => sale.status === 'CANCELED');

  const validExpenses = expenses.filter((expense) => expense.status !== 'CANCELED');

  const revenue = validSales.reduce(
    (total, sale) => total + toNumber(sale.total),
    0
  );

  const expensesTotal = validExpenses.reduce(
    (total, expense) => total + toNumber(expense.amount),
    0
  );

  const soldCost = validSales.reduce((total, sale) => {
    const saleCost = sale.items.reduce((itemsTotal, item) => {
      const cost = toNumber(item.unitCost ?? item.product?.cost);
      return itemsTotal + cost * item.quantity;
    }, 0);

    return total + saleCost;
  }, 0);

  const grossProfit = revenue - soldCost;
  const netProfit = revenue - soldCost - expensesTotal;
  const margin = calculateMargin(netProfit, revenue);
  const averageTicket = validSales.length > 0 ? revenue / validSales.length : 0;

  const stockValue = products.reduce(
    (total, product) => total + toNumber(product.cost) * product.stock,
    0
  );

  return {
    filters: buildAppliedFilters(filters),
    revenue,
    expensesTotal,
    soldCost,
    grossProfit,
    netProfit,
    margin,
    averageTicket,
    stockValue,
    productsTotal: products.length,
    activeProducts: activeProducts.length,
    criticalProducts: criticalProducts.length,
    salesTotal: sales.length,
    validSales: validSales.length,
    canceledSales: canceledSales.length,
    expensesTotalCount: expenses.length,
    usersTotal: users.length,
    activeUsers: users.filter((user) => user.isActive).length,
    suppliersTotal: suppliers.length,
    generatedAt: new Date().toISOString()
  };
}

async function getSalesAnalytics(companyId, filters = {}) {
  const dateFilter = buildDateFilter(filters);

  const sales = await prisma.sale.findMany({
    where: {
      companyId,
      ...dateFilter
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const validSales = sales.filter((sale) => sale.status !== 'CANCELED');

  const salesByStatus = sales.reduce((acc, sale) => {
    acc[sale.status] = (acc[sale.status] || 0) + 1;
    return acc;
  }, {});

  const productMap = new Map();

  validSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const productName = item.product?.name || 'Produto removido';
      const current = productMap.get(productName) || {
        productName,
        quantity: 0,
        revenue: 0
      };

      current.quantity += item.quantity;
      current.revenue += toNumber(item.unitPrice) * item.quantity;

      productMap.set(productName, current);
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    filters: buildAppliedFilters(filters),
    totalSales: sales.length,
    validSales: validSales.length,
    canceledSales: sales.filter((sale) => sale.status === 'CANCELED').length,
    salesByStatus,
    topProducts,
    recentSales: sales.slice(0, 10).map((sale) => ({
      id: sale.id,
      customerName: sale.customerName,
      status: sale.status,
      subtotal: toNumber(sale.subtotal),
      discount: toNumber(sale.discount),
      total: toNumber(sale.total),
      createdAt: sale.createdAt
    }))
  };
}

async function getStockAnalytics(companyId, filters = {}) {
  const dateFilter = buildDateFilter(filters);

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { companyId },
      include: { category: true, supplier: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.stockMovement.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const criticalProducts = products.filter(
    (product) => product.status === 'ACTIVE' && product.stock <= product.minStock
  );

  const outOfStockProducts = products.filter((product) => product.stock <= 0);

  const stockValue = products.reduce(
    (total, product) => total + toNumber(product.cost) * product.stock,
    0
  );

  const movementsByType = movements.reduce((acc, movement) => {
    acc[movement.type] = (acc[movement.type] || 0) + 1;
    return acc;
  }, {});

  return {
    filters: buildAppliedFilters(filters),
    productsTotal: products.length,
    activeProducts: products.filter((product) => product.status === 'ACTIVE').length,
    criticalProducts: criticalProducts.length,
    outOfStockProducts: outOfStockProducts.length,
    stockValue,
    movementsTotal: movements.length,
    movementsByType,
    criticalList: criticalProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      minStock: product.minStock,
      category: product.category?.name || null,
      supplier: product.supplier?.name || null
    })),
    recentMovements: movements.slice(0, 10).map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      productName: movement.product?.name || null,
      createdAt: movement.createdAt
    }))
  };
}

async function getFinanceAnalytics(companyId, filters = {}) {
  const dateFilter = buildDateFilter(filters);

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    }),
    prisma.expense.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const validSales = sales.filter((sale) => sale.status !== 'CANCELED');
  const validExpenses = expenses.filter((expense) => expense.status !== 'CANCELED');

  const revenue = validSales.reduce(
    (total, sale) => total + toNumber(sale.total),
    0
  );

  const expensesTotal = validExpenses.reduce(
    (total, expense) => total + toNumber(expense.amount),
    0
  );

  const soldCost = validSales.reduce((total, sale) => {
    return total + sale.items.reduce((itemsTotal, item) => {
      const cost = toNumber(item.unitCost ?? item.product?.cost);
      return itemsTotal + cost * item.quantity;
    }, 0);
  }, 0);

  const grossProfit = revenue - soldCost;
  const netProfit = revenue - soldCost - expensesTotal;
  const margin = calculateMargin(netProfit, revenue);

  const expensesByCategory = validExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Sem categoria';
    acc[category] = (acc[category] || 0) + toNumber(expense.amount);
    return acc;
  }, {});

  return {
    filters: buildAppliedFilters(filters),
    revenue,
    expensesTotal,
    soldCost,
    grossProfit,
    netProfit,
    margin,
    expensesByCategory,
    expensesByStatus: expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {}),
    recentExpenses: expenses.slice(0, 10).map((expense) => ({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      amount: toNumber(expense.amount),
      status: expense.status,
      dueDate: expense.dueDate,
      createdAt: expense.createdAt
    }))
  };
}

async function getPowerBiDataset(companyId, filters = {}) {
  const dateFilter = buildDateFilter(filters);

  const [
    kpis,
    salesAnalytics,
    stockAnalytics,
    financeAnalytics,
    products,
    sales,
    expenses,
    movements,
    auditLogs
  ] = await Promise.all([
    getKpis(companyId, filters),
    getSalesAnalytics(companyId, filters),
    getStockAnalytics(companyId, filters),
    getFinanceAnalytics(companyId, filters),
    prisma.product.findMany({
      where: { companyId },
      include: { category: true, supplier: true }
    }),
    prisma.sale.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    }),
    prisma.expense.findMany({
      where: {
        companyId,
        ...dateFilter
      }
    }),
    prisma.stockMovement.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      include: { product: true }
    }),
    prisma.auditLog.findMany({
      where: {
        companyId,
        ...dateFilter
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    })
  ]);

  return {
    metadata: {
      project: 'StockFlow S Plus',
      dataset: 'Power BI Operational Dataset',
      version: '1.1',
      generatedAt: new Date().toISOString(),
      filters: buildAppliedFilters(filters)
    },
    kpis,
    salesAnalytics,
    stockAnalytics,
    financeAnalytics,
    tables: {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        status: product.status,
        price: toNumber(product.price),
        cost: toNumber(product.cost),
        stock: product.stock,
        minStock: product.minStock,
        category: product.category?.name || null,
        supplier: product.supplier?.name || null,
        createdAt: product.createdAt
      })),
      sales: sales.map((sale) => ({
        id: sale.id,
        customerName: sale.customerName,
        status: sale.status,
        subtotal: toNumber(sale.subtotal),
        discount: toNumber(sale.discount),
        total: toNumber(sale.total),
        createdAt: sale.createdAt
      })),
      saleItems: sales.flatMap((sale) =>
        sale.items.map((item) => ({
          id: item.id,
          saleId: sale.id,
          productId: item.productId,
          productName: item.product?.name || null,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          unitCost: toNumber(item.unitCost ?? item.product?.cost),
          total: toNumber(item.total ?? toNumber(item.unitPrice) * item.quantity),
          createdAt: sale.createdAt
        }))
      ),
      expenses: expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        category: expense.category,
        amount: toNumber(expense.amount),
        status: expense.status,
        dueDate: expense.dueDate,
        createdAt: expense.createdAt
      })),
      stockMovements: movements.map((movement) => ({
        id: movement.id,
        productId: movement.productId,
        productName: movement.product?.name || null,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        createdAt: movement.createdAt
      })),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userId: log.userId,
        createdAt: log.createdAt
      }))
    }
  };
}

module.exports = {
  buildDateFilter,
  getKpis,
  getSalesAnalytics,
  getStockAnalytics,
  getFinanceAnalytics,
  getPowerBiDataset
};
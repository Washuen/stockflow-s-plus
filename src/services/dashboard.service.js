const { prisma } = require('../config/prisma');
const { calculateMargin } = require('../utils/money');

async function getDashboardSummary(companyId) {
  const [products, sales, expenses] = await Promise.all([
    prisma.product.findMany({ where: { companyId } }),
    prisma.sale.findMany({
      where: { companyId, status: 'PAID' },
      include: { items: true }
    }),
    prisma.expense.findMany({ where: { companyId, status: { not: 'CANCELED' } } })
  ]);

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const soldCost = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => {
      return itemSum + Number(item.unitCost) * item.quantity;
    }, 0);
  }, 0);

  const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const profit = revenue - soldCost - expensesTotal;
  const margin = calculateMargin(profit, revenue);
  const criticalProducts = products.filter((product) => product.stock <= product.minStock);
  const stockValue = products.reduce((sum, product) => sum + Number(product.cost) * product.stock, 0);

  return {
    revenue,
    soldCost,
    expensesTotal,
    profit,
    margin,
    activeProducts: products.filter((product) => product.status === 'ACTIVE').length,
    criticalProducts: criticalProducts.length,
    salesCount: sales.length,
    averageTicket: sales.length ? revenue / sales.length : 0,
    stockValue
  };
}

async function getReports(companyId) {
  const [products, sales] = await Promise.all([
    prisma.product.findMany({ where: { companyId }, include: { category: true } }),
    prisma.sale.findMany({ where: { companyId, status: 'PAID' }, include: { items: { include: { product: true } } } })
  ]);

  const criticalProducts = products.filter((product) => product.stock <= product.minStock);

  const productSales = new Map();
  for (const sale of sales) {
    for (const item of sale.items) {
      const current = productSales.get(item.productId) || { name: item.product.name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += Number(item.total);
      productSales.set(item.productId, current);
    }
  }

  const topProducts = [...productSales.values()].sort((a, b) => b.quantity - a.quantity);

  return {
    criticalProducts,
    topProducts,
    recentSales: sales.slice(0, 10)
  };
}

module.exports = {
  getDashboardSummary,
  getReports
};

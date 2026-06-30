import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import { SaleStatus, ExpenseStatus } from '@prisma/client';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

let token;
let companyId;
let actorUserId;

async function getOrCreateCompany() {
  let company = await prisma.company.findFirst();

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'StockFlow Test Company'
      }
    });
  }

  return company;
}

async function createOwnerAndLogin() {
  const company = await getOrCreateCompany();
  companyId = company.id;

  const email = `analytics-owner-${crypto.randomUUID()}@stockflow.dev`;
  const password = '123456';

  const owner = await prisma.user.create({
    data: {
      name: 'Analytics Owner',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'OWNER',
      isActive: true,
      companyId: company.id
    }
  });

  actorUserId = owner.id;

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTruthy();

  return response.body.token;
}

async function seedAnalyticsData() {
  const category = await prisma.category.create({
    data: {
      name: `Categoria Analytics ${crypto.randomUUID()}`,
      companyId
    }
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: `Fornecedor Analytics ${crypto.randomUUID()}`,
      companyId
    }
  });

  const product = await prisma.product.create({
    data: {
      name: `Produto Analytics ${crypto.randomUUID()}`,
      sku: `AN-${crypto.randomUUID()}`,
      price: 100,
      cost: 40,
      stock: 20,
      minStock: 5,
      status: 'ACTIVE',
      companyId,
      categoryId: category.id,
      supplierId: supplier.id
    }
  });

  const criticalProduct = await prisma.product.create({
    data: {
      name: `Produto Crítico Analytics ${crypto.randomUUID()}`,
      sku: `CR-${crypto.randomUUID()}`,
      price: 80,
      cost: 30,
      stock: 2,
      minStock: 5,
      status: 'ACTIVE',
      companyId,
      categoryId: category.id,
      supplierId: supplier.id
    }
  });

  const sale = await prisma.sale.create({
    data: {
      customerName: 'Cliente Analytics',
      subtotal: 200,
      discount: 0,
      total: 200,
      status: SaleStatus.PAID,
      company: {
        connect: {
          id: companyId
        }
      },
      user: {
        connect: {
          id: actorUserId
        }
      },
      items: {
        create: [
          {
            product: {
              connect: {
                id: product.id
              }
            },
            quantity: 2,
            unitPrice: 100,
            unitCost: 40,
            total: 200
          }
        ]
      }
    }
  });

  await prisma.sale.create({
    data: {
      customerName: 'Cliente Cancelado Analytics',
      subtotal: 100,
      discount: 0,
      total: 100,
      status: SaleStatus.CANCELED,
      company: {
        connect: {
          id: companyId
        }
      },
      user: {
        connect: {
          id: actorUserId
        }
      },
      items: {
        create: [
          {
            product: {
              connect: {
                id: criticalProduct.id
              }
            },
            quantity: 1,
            unitPrice: 80,
            unitCost: 30,
            total: 80
          }
        ]
      }
    }
  });

  await prisma.expense.create({
    data: {
      description: 'Despesa Analytics',
      category: 'Operacional',
      amount: 50,
      status: ExpenseStatus.PAID,
      dueDate: new Date(),
      company: {
        connect: {
          id: companyId
        }
      },
      user: {
        connect: {
          id: actorUserId
        }
      }
    }
  });

  await prisma.stockMovement.create({
    data: {
      type: 'IN',
      quantity: 10,
      reason: 'Entrada Analytics',
      product: {
        connect: {
          id: product.id
        }
      },
      company: {
        connect: {
          id: companyId
        }
      },
      user: {
        connect: {
          id: actorUserId
        }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'ANALYTICS_TEST',
      entity: 'Analytics',
      entityId: sale.id,
      userId: actorUserId,
      companyId,
      metadata: {
        source: 'analytics.test.js'
      }
    }
  });
}

beforeAll(async () => {
  token = await createOwnerAndLogin();
  await seedAnalyticsData();
});

describe('analytics routes', () => {
  it('deve bloquear KPIs sem autenticação', async () => {
    const response = await request(app)
      .get('/api/analytics/kpis');

    expect(response.status).toBe(401);
  });

  it('deve retornar KPIs analíticos', async () => {
    const response = await request(app)
      .get('/api/analytics/kpis')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('expensesTotal');
    expect(response.body).toHaveProperty('netProfit');
    expect(response.body).toHaveProperty('margin');
    expect(response.body).toHaveProperty('averageTicket');
    expect(response.body).toHaveProperty('stockValue');
    expect(response.body).toHaveProperty('criticalProducts');
    expect(response.body).toHaveProperty('generatedAt');
  });

  it('deve retornar analytics de vendas', async () => {
    const response = await request(app)
      .get('/api/analytics/sales')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalSales');
    expect(response.body).toHaveProperty('validSales');
    expect(response.body).toHaveProperty('canceledSales');
    expect(response.body).toHaveProperty('salesByStatus');
    expect(response.body).toHaveProperty('topProducts');
    expect(response.body).toHaveProperty('recentSales');

    expect(Array.isArray(response.body.topProducts)).toBe(true);
    expect(Array.isArray(response.body.recentSales)).toBe(true);
  });

  it('deve retornar analytics de estoque', async () => {
    const response = await request(app)
      .get('/api/analytics/stock')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productsTotal');
    expect(response.body).toHaveProperty('activeProducts');
    expect(response.body).toHaveProperty('criticalProducts');
    expect(response.body).toHaveProperty('outOfStockProducts');
    expect(response.body).toHaveProperty('stockValue');
    expect(response.body).toHaveProperty('movementsTotal');
    expect(response.body).toHaveProperty('movementsByType');
    expect(response.body).toHaveProperty('criticalList');
    expect(response.body).toHaveProperty('recentMovements');

    expect(Array.isArray(response.body.criticalList)).toBe(true);
    expect(Array.isArray(response.body.recentMovements)).toBe(true);
  });

  it('deve retornar analytics financeiro', async () => {
    const response = await request(app)
      .get('/api/analytics/finance')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('expensesTotal');
    expect(response.body).toHaveProperty('soldCost');
    expect(response.body).toHaveProperty('grossProfit');
    expect(response.body).toHaveProperty('netProfit');
    expect(response.body).toHaveProperty('margin');
    expect(response.body).toHaveProperty('expensesByCategory');
    expect(response.body).toHaveProperty('expensesByStatus');
    expect(response.body).toHaveProperty('recentExpenses');

    expect(Array.isArray(response.body.recentExpenses)).toBe(true);
  });

  it('deve retornar dataset para Power BI', async () => {
    const response = await request(app)
      .get('/api/analytics/powerbi')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('metadata');
    expect(response.body).toHaveProperty('kpis');
    expect(response.body).toHaveProperty('salesAnalytics');
    expect(response.body).toHaveProperty('stockAnalytics');
    expect(response.body).toHaveProperty('financeAnalytics');
    expect(response.body).toHaveProperty('tables');

    expect(response.body.metadata.project).toBe('StockFlow S Plus');
    expect(response.body.metadata.dataset).toBe('Power BI Operational Dataset');

    expect(response.body.tables).toHaveProperty('products');
    expect(response.body.tables).toHaveProperty('sales');
    expect(response.body.tables).toHaveProperty('saleItems');
    expect(response.body.tables).toHaveProperty('expenses');
    expect(response.body.tables).toHaveProperty('stockMovements');
    expect(response.body.tables).toHaveProperty('auditLogs');

    expect(Array.isArray(response.body.tables.products)).toBe(true);
    expect(Array.isArray(response.body.tables.sales)).toBe(true);
    expect(Array.isArray(response.body.tables.saleItems)).toBe(true);
    expect(Array.isArray(response.body.tables.expenses)).toBe(true);
    expect(Array.isArray(response.body.tables.stockMovements)).toBe(true);
    expect(Array.isArray(response.body.tables.auditLogs)).toBe(true);
  });

  it('deve bloquear dataset Power BI sem autenticação', async () => {
    const response = await request(app)
      .get('/api/analytics/powerbi');

    expect(response.status).toBe(401);
  });

  it('deve retornar KPIs com filtros de período aplicados', async () => {
    const response = await request(app)
      .get('/api/analytics/kpis')
      .query({
        startDate: '2020-01-01',
        endDate: '2100-12-31'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('filters');
    expect(response.body.filters.startDate).toBe('2020-01-01');
    expect(response.body.filters.endDate).toBe('2100-12-31');
    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('netProfit');
  });

  it('deve retornar vendas vazias para período futuro sem registros', async () => {
    const response = await request(app)
      .get('/api/analytics/sales')
      .query({
        startDate: '2999-01-01',
        endDate: '2999-12-31'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.filters.startDate).toBe('2999-01-01');
    expect(response.body.filters.endDate).toBe('2999-12-31');
    expect(response.body.totalSales).toBe(0);
    expect(response.body.validSales).toBe(0);
    expect(response.body.canceledSales).toBe(0);
    expect(response.body.topProducts).toEqual([]);
    expect(response.body.recentSales).toEqual([]);
  });

  it('deve retornar dataset Power BI com filtros no metadata', async () => {
    const response = await request(app)
      .get('/api/analytics/powerbi')
      .query({
        startDate: '2020-01-01',
        endDate: '2100-12-31'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.metadata).toHaveProperty('filters');
    expect(response.body.metadata.filters.startDate).toBe('2020-01-01');
    expect(response.body.metadata.filters.endDate).toBe('2100-12-31');
    expect(response.body.metadata.version).toBe('1.1');
  });

  it('deve bloquear analytics com startDate inválida', async () => {
    const response = await request(app)
      .get('/api/analytics/kpis')
      .query({
        startDate: 'data-invalida'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('deve bloquear analytics quando startDate for maior que endDate', async () => {
    const response = await request(app)
      .get('/api/analytics/finance')
      .query({
        startDate: '2026-12-31',
        endDate: '2026-01-01'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
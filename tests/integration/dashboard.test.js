import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createProduct(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/products')
    .set(authHeader(token))
    .send({
      name: `Produto Dashboard ${unique}`,
      sku: `DASH-${unique}`,
      price: 100,
      cost: 40,
      stock: 10,
      minStock: 2,
      status: 'ACTIVE',
      ...overrides
    });

  expect(response.status).toBe(201);
  return response.body;
}

describe('Dashboard API', () => {
  it('deve retornar resumo executivo', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('soldCost');
    expect(response.body).toHaveProperty('expensesTotal');
    expect(response.body).toHaveProperty('profit');
    expect(response.body).toHaveProperty('margin');
    expect(response.body).toHaveProperty('activeProducts');
    expect(response.body).toHaveProperty('criticalProducts');
    expect(response.body).toHaveProperty('salesCount');
    expect(response.body).toHaveProperty('averageTicket');
    expect(response.body).toHaveProperty('stockValue');
  });

  it('deve bloquear resumo executivo sem token', async () => {
    const response = await request(app)
      .get('/api/dashboard/summary');

    expect(response.status).toBe(401);
  });

  it('deve refletir venda, custo, estoque e despesas no resumo', async () => {
    const token = await loginAsAdmin();

    const product = await createProduct(token, {
      price: 120,
      cost: 50,
      stock: 10,
      minStock: 2
    });

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Dashboard',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 2
          }
        ]
      });

    expect(saleResponse.status).toBe(201);

    const expenseResponse = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: `Despesa Dashboard ${crypto.randomUUID()}`,
        category: 'Dashboard',
        amount: 30,
        status: 'PENDING'
      });

    expect(expenseResponse.status).toBe(201);

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set(authHeader(token));

    expect(response.status).toBe(200);

    expect(Number(response.body.revenue)).toBeGreaterThanOrEqual(240);
    expect(Number(response.body.soldCost)).toBeGreaterThanOrEqual(100);
    expect(Number(response.body.expensesTotal)).toBeGreaterThanOrEqual(30);
    expect(Number(response.body.salesCount)).toBeGreaterThanOrEqual(1);
    expect(Number(response.body.stockValue)).toBeGreaterThanOrEqual(0);
  });

  it('deve contar produto crítico no resumo', async () => {
    const token = await loginAsAdmin();

    await createProduct(token, {
      stock: 1,
      minStock: 5,
      status: 'ACTIVE'
    });

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Number(response.body.criticalProducts)).toBeGreaterThanOrEqual(1);
  });

  it('deve retornar relatórios operacionais', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/reports')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('criticalProducts');
    expect(response.body).toHaveProperty('topProducts');
    expect(response.body).toHaveProperty('recentSales');

    expect(Array.isArray(response.body.criticalProducts)).toBe(true);
    expect(Array.isArray(response.body.topProducts)).toBe(true);
    expect(Array.isArray(response.body.recentSales)).toBe(true);
  });

  it('deve bloquear relatórios sem token', async () => {
    const response = await request(app)
      .get('/api/reports');

    expect(response.status).toBe(401);
  });

  it('deve incluir produto vendido nos top products', async () => {
    const token = await loginAsAdmin();

    const product = await createProduct(token, {
      name: `Produto Top Dashboard ${crypto.randomUUID()}`,
      price: 90,
      cost: 30,
      stock: 10
    });

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Top Product',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 3
          }
        ]
      });

    expect(saleResponse.status).toBe(201);

    const response = await request(app)
      .get('/api/reports')
      .set(authHeader(token));

    expect(response.status).toBe(200);

    const topProduct = response.body.topProducts.find(
      (item) => item.name === product.name
    );

    expect(topProduct).toBeTruthy();
    expect(topProduct.quantity).toBeGreaterThanOrEqual(3);
    expect(Number(topProduct.revenue)).toBeGreaterThanOrEqual(270);
  });
});
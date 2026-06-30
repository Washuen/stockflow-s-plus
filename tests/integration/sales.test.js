import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createTestProduct(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/products')
    .set(authHeader(token))
    .send({
      name: `Produto Venda Teste ${unique}`,
      sku: `SALE-${unique}`,
      price: 100,
      cost: 50,
      stock: 20,
      minStock: 2,
      status: 'ACTIVE',
      ...overrides
    });

  expect(response.status).toBe(201);

  return response.body;
}

describe('Sales API', () => {
  it('deve listar vendas autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/sales')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve criar venda e baixar estoque', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 10 });

    const response = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Teste Venda',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 3
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PAID');
    expect(Number(response.body.total)).toBe(300);
    expect(response.body.items).toHaveLength(1);

    const productAfterResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterResponse.status).toBe(200);
    expect(productAfterResponse.body.stock).toBe(7);
  });

  it('deve aplicar desconto ao criar venda', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 10, price: 80 });

    const response = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Com Desconto',
        discount: 20,
        items: [
          {
            productId: product.id,
            quantity: 2
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(Number(response.body.subtotal)).toBe(160);
    expect(Number(response.body.discount)).toBe(20);
    expect(Number(response.body.total)).toBe(140);
  });

  it('deve bloquear criação de venda sem token', async () => {
    const response = await request(app)
      .post('/api/sales')
      .send({
        customerName: 'Cliente Sem Token',
        discount: 0,
        items: [
          {
            productId: 'produto-qualquer',
            quantity: 1
          }
        ]
      });

    expect(response.status).toBe(401);
  });

  it('deve bloquear venda com produto inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Produto Inexistente',
        discount: 0,
        items: [
          {
            productId: 'produto-inexistente',
            quantity: 1
          }
        ]
      });

    expect(response.status).toBe(400);
  });

  it('deve bloquear venda com estoque insuficiente', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 2 });

    const response = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Estoque Insuficiente',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 999
          }
        ]
      });

    expect(response.status).toBe(400);
  });

  it('deve cancelar venda e restaurar estoque', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 10 });

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Cancelamento',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 4
          }
        ]
      });

    expect(saleResponse.status).toBe(201);

    const productAfterSaleResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterSaleResponse.status).toBe(200);
    expect(productAfterSaleResponse.body.stock).toBe(6);

    const cancelResponse = await request(app)
      .patch(`/api/sales/${saleResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de cancelamento'
      });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe('CANCELED');

    const productAfterCancelResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterCancelResponse.status).toBe(200);
    expect(productAfterCancelResponse.body.stock).toBe(10);
  });

  it('deve bloquear cancelamento de venda já cancelada', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 10 });

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Cancelamento Duplo',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 1
          }
        ]
      });

    expect(saleResponse.status).toBe(201);

    const firstCancelResponse = await request(app)
      .patch(`/api/sales/${saleResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Primeiro cancelamento'
      });

    expect(firstCancelResponse.status).toBe(200);

    const secondCancelResponse = await request(app)
      .patch(`/api/sales/${saleResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Segundo cancelamento'
      });

    expect(secondCancelResponse.status).toBe(400);
  });

  it('deve reativar venda cancelada e baixar estoque novamente', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 10 });

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Reativação',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 2
          }
        ]
      });

    expect(saleResponse.status).toBe(201);

    const cancelResponse = await request(app)
      .patch(`/api/sales/${saleResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Preparando reativação'
      });

    expect(cancelResponse.status).toBe(200);

    const reactivateResponse = await request(app)
      .patch(`/api/sales/${saleResponse.body.id}/reactivate`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de reativação'
      });

    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.body.status).toBe('PAID');

    const productAfterReactivateResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterReactivateResponse.status).toBe(200);
    expect(productAfterReactivateResponse.body.stock).toBe(8);
  });

  it('deve bloquear reativação de venda não cancelada', async () => {
    const token = await loginAsAdmin();
    const product = await createTestProduct(token, { stock: 10 });

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Reativação Inválida',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 1
          }
        ]
      });

    expect(saleResponse.status).toBe(201);

    const reactivateResponse = await request(app)
      .patch(`/api/sales/${saleResponse.body.id}/reactivate`)
      .set(authHeader(token))
      .send({
        reason: 'Tentativa inválida'
      });

    expect(reactivateResponse.status).toBe(400);
  });

  it('deve retornar 404 ao cancelar venda inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/sales/sale-inexistente/cancel')
      .set(authHeader(token))
      .send({
        reason: 'Teste 404'
      });

    expect(response.status).toBe(404);
  });

  it('deve retornar 404 ao reativar venda inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/sales/sale-inexistente/reactivate')
      .set(authHeader(token))
      .send({
        reason: 'Teste 404'
      });

    expect(response.status).toBe(404);
  });
});
import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

describe('Stock API', () => {
  it('deve listar movimentações autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/stock-movements')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve registrar entrada de estoque', async () => {
    const token = await loginAsAdmin();

    const productResponse = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: `Produto Entrada Estoque ${Date.now()}`,
        sku: `STOCK-IN-${crypto.randomUUID()}`,
        price: 100,
        cost: 50,
        stock: 5,
        minStock: 2,
        status: 'ACTIVE'
      });

    expect(productResponse.status).toBe(201);

    const movementResponse = await request(app)
      .post('/api/stock-movements')
      .set(authHeader(token))
      .send({
        productId: productResponse.body.id,
        type: 'IN',
        quantity: 10,
        reason: 'Teste automatizado de entrada'
      });

    expect(movementResponse.status).toBe(201);
    expect(movementResponse.body.type).toBe('IN');
    expect(movementResponse.body.quantity).toBe(10);
  });

  it('deve registrar saída de estoque', async () => {
    const token = await loginAsAdmin();

    const productResponse = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: `Produto Saida Estoque ${Date.now()}`,
        sku: `STOCK-OUT-${crypto.randomUUID()}`,
        price: 100,
        cost: 50,
        stock: 20,
        minStock: 2,
        status: 'ACTIVE'
      });

    expect(productResponse.status).toBe(201);

    const movementResponse = await request(app)
      .post('/api/stock-movements')
      .set(authHeader(token))
      .send({
        productId: productResponse.body.id,
        type: 'OUT',
        quantity: 5,
        reason: 'Teste automatizado de saída'
      });

    expect(movementResponse.status).toBe(201);
    expect(movementResponse.body.type).toBe('OUT');
    expect(movementResponse.body.quantity).toBe(5);
  });

  it('deve bloquear saída com estoque insuficiente', async () => {
    const token = await loginAsAdmin();

    const productResponse = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: `Produto Estoque Insuficiente ${Date.now()}`,
        sku: `STOCK-BLOCK-${crypto.randomUUID()}`,
        price: 100,
        cost: 50,
        stock: 3,
        minStock: 1,
        status: 'ACTIVE'
      });

    expect(productResponse.status).toBe(201);

    const movementResponse = await request(app)
      .post('/api/stock-movements')
      .set(authHeader(token))
      .send({
        productId: productResponse.body.id,
        type: 'OUT',
        quantity: 999,
        reason: 'Teste de bloqueio'
      });

    expect(movementResponse.status).toBe(400);
  });

  it('deve retornar 404 ao movimentar produto inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/stock-movements')
      .set(authHeader(token))
      .send({
        productId: 'produto-inexistente',
        type: 'IN',
        quantity: 1,
        reason: 'Teste 404'
      });

    expect(response.status).toBe(404);
  });
});
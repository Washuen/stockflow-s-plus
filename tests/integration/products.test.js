import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createProduct(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/products')
    .set(authHeader(token))
    .send({
      name: `Produto Teste ${unique}`,
      sku: `PROD-${unique}`,
      price: 100,
      cost: 50,
      stock: 10,
      minStock: 2,
      status: 'ACTIVE',
      ...overrides
    });

  expect(response.status).toBe(201);

  return response.body;
}

describe('Products API', () => {
  it('deve listar produtos autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/products')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve criar produto autenticado como Admin', async () => {
    const token = await loginAsAdmin();
    const unique = crypto.randomUUID();

    const response = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: `Produto Criar ${unique}`,
        sku: `CREATE-${unique}`,
        price: 120,
        cost: 70,
        stock: 15,
        minStock: 3,
        status: 'ACTIVE'
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toContain('Produto Criar');
    expect(response.body.sku).toContain('CREATE-');
    expect(Number(response.body.price)).toBe(120);
    expect(Number(response.body.cost)).toBe(70);
    expect(response.body.stock).toBe(15);
    expect(response.body.status).toBe('ACTIVE');
  });

  it('deve bloquear produto sem token', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({
        name: 'Produto Sem Token',
        sku: `NO-TOKEN-${crypto.randomUUID()}`,
        price: 100,
        cost: 50,
        stock: 10,
        minStock: 2,
        status: 'ACTIVE'
      });

    expect(response.status).toBe(401);
  });

  it('deve buscar produto por id', async () => {
    const token = await loginAsAdmin();
    const product = await createProduct(token);

    const response = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(product.id);
    expect(response.body.sku).toBe(product.sku);
  });

  it('deve retornar 404 ao buscar produto inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/products/product-inexistente')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });

  it('deve atualizar produto', async () => {
    const token = await loginAsAdmin();
    const product = await createProduct(token);

    const response = await request(app)
      .patch(`/api/products/${product.id}`)
      .set(authHeader(token))
      .send({
        name: 'Produto Atualizado Teste',
        sku: product.sku,
        price: 150,
        cost: 80,
        stock: product.stock,
        minStock: 5,
        status: 'ACTIVE'
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Produto Atualizado Teste');
    expect(Number(response.body.price)).toBe(150);
    expect(Number(response.body.cost)).toBe(80);
    expect(response.body.minStock).toBe(5);
  });

  it('deve retornar 404 ao atualizar produto inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/products/product-inexistente')
      .set(authHeader(token))
      .send({
        name: 'Produto Inexistente',
        sku: `MISSING-${crypto.randomUUID()}`,
        price: 100,
        cost: 50,
        stock: 10,
        minStock: 2,
        status: 'ACTIVE'
      });

    expect(response.status).toBe(404);
  });

  it('deve bloquear criação de produto com SKU duplicado', async () => {
    const token = await loginAsAdmin();
    const unique = crypto.randomUUID();
    const sku = `DUP-${unique}`;

    const firstResponse = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: 'Produto Duplicado 1',
        sku,
        price: 100,
        cost: 50,
        stock: 10,
        minStock: 2,
        status: 'ACTIVE'
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: 'Produto Duplicado 2',
        sku,
        price: 100,
        cost: 50,
        stock: 10,
        minStock: 2,
        status: 'ACTIVE'
      });

    expect([400, 409]).toContain(secondResponse.status);
  });

  it('deve bloquear produto com dados inválidos', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: '',
        sku: '',
        price: -10,
        cost: -5,
        stock: -1,
        minStock: -1,
        status: 'ACTIVE'
      });

    expect(response.status).toBe(400);
  });

  it('deve inativar produto', async () => {
    const token = await loginAsAdmin();
    const product = await createProduct(token);

    const response = await request(app)
      .patch(`/api/products/${product.id}/deactivate`)
      .set(authHeader(token));

    expect(response.status).toBe(200);

    const productAfterResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterResponse.status).toBe(200);
    expect(productAfterResponse.body.status).toBe('INACTIVE');
  });

  it('deve reativar produto', async () => {
    const token = await loginAsAdmin();
    const product = await createProduct(token);

    const deactivateResponse = await request(app)
      .patch(`/api/products/${product.id}/deactivate`)
      .set(authHeader(token));

    expect(deactivateResponse.status).toBe(200);

    const reactivateResponse = await request(app)
      .patch(`/api/products/${product.id}/reactivate`)
      .set(authHeader(token));

    expect(reactivateResponse.status).toBe(200);

    const productAfterResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterResponse.status).toBe(200);
    expect(productAfterResponse.body.status).toBe('ACTIVE');
  });

  it('deve retornar 404 ao inativar produto inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/products/product-inexistente/deactivate')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });

  it('deve retornar 404 ao reativar produto inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/products/product-inexistente/reactivate')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });
});
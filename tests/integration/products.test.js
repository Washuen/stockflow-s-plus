import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

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

    const response = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: `Produto Teste ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        price: 199.9,
        cost: 90,
        stock: 15,
        minStock: 5,
        status: 'ACTIVE'
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toContain('Produto Teste');
  });

  it('deve bloquear produto sem token', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(401);
  });
});

import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

describe('Sales API', () => {
  it('deve criar venda e baixar estoque', async () => {
    const token = await loginAsAdmin();

    const productsResponse = await request(app)
      .get('/api/products')
      .set(authHeader(token));

    const product = productsResponse.body.find((item) => item.stock > 0);
    expect(product).toBeTruthy();

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Teste Integração',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 1
          }
        ]
      });

    expect(saleResponse.status).toBe(201);
    expect(saleResponse.body.total).toBeTruthy();

    const productAfterResponse = await request(app)
      .get(`/api/products/${product.id}`)
      .set(authHeader(token));

    expect(productAfterResponse.body.stock).toBe(product.stock - 1);
  });

  it('deve bloquear venda com estoque insuficiente', async () => {
    const token = await loginAsAdmin();

    const productsResponse = await request(app)
      .get('/api/products')
      .set(authHeader(token));

    const product = productsResponse.body[0];

    const saleResponse = await request(app)
      .post('/api/sales')
      .set(authHeader(token))
      .send({
        customerName: 'Cliente Estoque Insuficiente',
        discount: 0,
        items: [
          {
            productId: product.id,
            quantity: 999999
          }
        ]
      });

    expect(saleResponse.status).toBe(400);
  });
});

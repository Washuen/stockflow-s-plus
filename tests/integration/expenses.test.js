import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

describe('Expenses API', () => {
  it('deve listar despesas autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/expenses')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve criar despesa autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: `Despesa Teste ${Date.now()}`,
        category: 'Operacional',
        amount: 125.5,
        status: 'PENDING',
        dueDate: null
      });

    expect(response.status).toBe(201);
    expect(response.body.description).toContain('Despesa Teste');
    expect(Number(response.body.amount)).toBe(125.5);
    expect(response.body.status).toBe('PENDING');
  });

  it('deve cancelar despesa', async () => {
    const token = await loginAsAdmin();

    const createResponse = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: `Despesa Cancelar ${Date.now()}`,
        category: 'Operacional',
        amount: 80,
        status: 'PENDING'
      });

    expect(createResponse.status).toBe(201);

    const cancelResponse = await request(app)
      .patch(`/api/expenses/${createResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de cancelamento'
      });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe('CANCELED');
  });

  it('deve reativar despesa cancelada', async () => {
    const token = await loginAsAdmin();

    const createResponse = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: `Despesa Reativar ${Date.now()}`,
        category: 'Operacional',
        amount: 90,
        status: 'PENDING'
      });

    expect(createResponse.status).toBe(201);

    const cancelResponse = await request(app)
      .patch(`/api/expenses/${createResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Preparando reativação'
      });

    expect(cancelResponse.status).toBe(200);

    const reactivateResponse = await request(app)
      .patch(`/api/expenses/${createResponse.body.id}/reactivate`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de reativação'
      });

    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.body.status).toBe('PENDING');
  });

  it('deve bloquear criação de despesa sem token', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .send({
        description: 'Despesa sem token',
        category: 'Operacional',
        amount: 50,
        status: 'PENDING'
      });

    expect(response.status).toBe(401);
  });

  it('deve retornar 404 ao cancelar despesa inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/expenses/expense-inexistente/cancel')
      .set(authHeader(token))
      .send({
        reason: 'Teste 404'
      });

    expect(response.status).toBe(404);
  });
});
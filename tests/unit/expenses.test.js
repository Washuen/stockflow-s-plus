import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createExpense(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/expenses')
    .set(authHeader(token))
    .send({
      description: `Despesa Teste ${unique}`,
      category: 'Operacional',
      amount: 125.5,
      status: 'PENDING',
      dueDate: null,
      ...overrides
    });

  expect(response.status).toBe(201);

  return response.body;
}

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
        description: `Despesa Teste ${crypto.randomUUID()}`,
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

  it('deve criar despesa paga', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: `Despesa Paga ${crypto.randomUUID()}`,
        category: 'Financeiro',
        amount: 220,
        status: 'PAID',
        dueDate: new Date().toISOString()
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PAID');
    expect(Number(response.body.amount)).toBe(220);
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

  it('deve bloquear criação de despesa com dados inválidos', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: '',
        category: '',
        amount: -10,
        status: 'INVALID_STATUS'
      });

    expect(response.status).toBe(400);
  });

  it('deve cancelar despesa', async () => {
    const token = await loginAsAdmin();

    const expense = await createExpense(token, {
      description: `Despesa Cancelar ${crypto.randomUUID()}`,
      amount: 80,
      status: 'PENDING'
    });

    const cancelResponse = await request(app)
      .patch(`/api/expenses/${expense.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de cancelamento'
      });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe('CANCELED');
  });

  it('deve bloquear cancelamento sem token', async () => {
    const token = await loginAsAdmin();
    const expense = await createExpense(token);

    const response = await request(app)
      .patch(`/api/expenses/${expense.id}/cancel`)
      .send({
        reason: 'Tentativa sem token'
      });

    expect(response.status).toBe(401);
  });

  it('deve bloquear cancelamento de despesa já cancelada', async () => {
    const token = await loginAsAdmin();
    const expense = await createExpense(token);

    const firstCancelResponse = await request(app)
      .patch(`/api/expenses/${expense.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Primeiro cancelamento'
      });

    expect(firstCancelResponse.status).toBe(200);

    const secondCancelResponse = await request(app)
      .patch(`/api/expenses/${expense.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Segundo cancelamento'
      });

    expect(secondCancelResponse.status).toBe(400);
  });

  it('deve reativar despesa cancelada', async () => {
    const token = await loginAsAdmin();

    const expense = await createExpense(token, {
      description: `Despesa Reativar ${crypto.randomUUID()}`,
      amount: 90,
      status: 'PENDING'
    });

    const cancelResponse = await request(app)
      .patch(`/api/expenses/${expense.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Preparando reativação'
      });

    expect(cancelResponse.status).toBe(200);

    const reactivateResponse = await request(app)
      .patch(`/api/expenses/${expense.id}/reactivate`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de reativação'
      });

    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.body.status).toBe('PENDING');
  });

  it('deve bloquear reativação sem token', async () => {
    const token = await loginAsAdmin();
    const expense = await createExpense(token);

    const cancelResponse = await request(app)
      .patch(`/api/expenses/${expense.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Preparando teste sem token'
      });

    expect(cancelResponse.status).toBe(200);

    const response = await request(app)
      .patch(`/api/expenses/${expense.id}/reactivate`)
      .send({
        reason: 'Tentativa sem token'
      });

    expect(response.status).toBe(401);
  });

  it('deve bloquear reativação de despesa ativa', async () => {
    const token = await loginAsAdmin();
    const expense = await createExpense(token);

    const response = await request(app)
      .patch(`/api/expenses/${expense.id}/reactivate`)
      .set(authHeader(token))
      .send({
        reason: 'Tentativa de reativar despesa ativa'
      });

    expect(response.status).toBe(400);
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

  it('deve retornar 404 ao reativar despesa inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/expenses/expense-inexistente/reactivate')
      .set(authHeader(token))
      .send({
        reason: 'Teste 404'
      });

    expect(response.status).toBe(404);
  });
});
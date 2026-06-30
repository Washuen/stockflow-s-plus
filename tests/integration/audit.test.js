import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

describe('Audit API', () => {
  it('deve listar logs de auditoria autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/audit')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('logs');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(Array.isArray(response.body.logs)).toBe(true);
  });

  it('deve retornar resumo de auditoria autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/audit/summary')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('users');
    expect(response.body).toHaveProperty('critical');
    expect(response.body).toHaveProperty('latest');
    expect(Array.isArray(response.body.latest)).toBe(true);
  });

  it('deve bloquear listagem de auditoria sem token', async () => {
    const response = await request(app)
      .get('/api/audit');

    expect(response.status).toBe(401);
  });

  it('deve bloquear resumo de auditoria sem token', async () => {
    const response = await request(app)
      .get('/api/audit/summary');

    expect(response.status).toBe(401);
  });

  it('deve registrar ação crítica após cancelar despesa', async () => {
    const token = await loginAsAdmin();

    const createExpenseResponse = await request(app)
      .post('/api/expenses')
      .set(authHeader(token))
      .send({
        description: `Despesa Audit ${crypto.randomUUID()}`,
        category: 'Auditoria',
        amount: 75,
        status: 'PENDING'
      });

    expect(createExpenseResponse.status).toBe(201);

    const cancelResponse = await request(app)
      .patch(`/api/expenses/${createExpenseResponse.body.id}/cancel`)
      .set(authHeader(token))
      .send({
        reason: 'Teste automatizado de auditoria'
      });

    expect(cancelResponse.status).toBe(200);

    const auditResponse = await request(app)
      .get('/api/audit')
      .set(authHeader(token));

    expect(auditResponse.status).toBe(200);

    const logs = auditResponse.body.logs || auditResponse.body.data;

    const relatedLog = logs.find((log) => {
      const sameEntityId = log.entityId === createExpenseResponse.body.id;
      const action = String(log.action || '').toUpperCase();
      const details = String(log.details || '').toUpperCase();

      return sameEntityId || action.includes('CANCEL') || details.includes('CANCEL');
    });

    expect(relatedLog).toBeTruthy();
  });

  it('deve filtrar logs por entidade quando informado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/audit?entity=Expense')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('logs');
    expect(Array.isArray(response.body.logs)).toBe(true);
  });

  it('deve filtrar logs por ação quando informado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/audit?action=CANCEL')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('logs');
    expect(Array.isArray(response.body.logs)).toBe(true);
  });
});
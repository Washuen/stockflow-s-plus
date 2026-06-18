import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

describe('Dashboard API', () => {
  it('deve retornar resumo executivo', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('profit');
    expect(response.body).toHaveProperty('criticalProducts');
  });
});

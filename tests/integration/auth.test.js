import { describe, it, expect } from 'vitest';
import { app, request } from '../helpers.js';

describe('Auth API', () => {
  it('deve fazer login com usuário admin do seed', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@stockflow.dev',
        password: '123456'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('admin@stockflow.dev');
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('deve bloquear login com senha incorreta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@stockflow.dev',
        password: 'senha-errada'
      });

    expect(response.status).toBe(401);
  });
});

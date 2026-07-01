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
  expect(response.body.user.role).toBe('ADMIN');
});

it('deve fazer login com usuário owner do seed', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'owner@stockflow.dev',
      password: '123456'
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTruthy();
  expect(response.body.user.email).toBe('owner@stockflow.dev');
  expect(response.body.user.passwordHash).toBeUndefined();
  expect(response.body.user.role).toBe('OWNER');
});

  it('deve bloquear login com senha incorreta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@stockflow.dev',
        password: 'senha-errada'
      });

    expect(response.status).toBe(401);
  });

  it('deve bloquear login com usuário inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'inexistente@stockflow.dev',
        password: '123456'
      });

    expect(response.status).toBe(401);
  });

  it('deve bloquear login sem e-mail', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        password: '123456'
      });

    expect(response.status).toBe(400);
  });

  it('deve bloquear login sem senha', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@stockflow.dev'
      });

    expect(response.status).toBe(400);
  });

  it('deve bloquear login com e-mail inválido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'email-invalido',
        password: '123456'
      });

    expect(response.status).toBe(400);
  });

  it('deve bloquear login com payload vazio', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
  });

  it('deve retornar usuário autenticado em /me', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@stockflow.dev',
        password: '123456'
      });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('owner@stockflow.dev');
    expect(response.body.role).toBe('OWNER');
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('deve bloquear /me sem token', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('deve bloquear /me com token inválido', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
  });

  it('deve bloquear /me com formato de autorização inválido', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Token formato-invalido');

    expect(response.status).toBe(401);
  });
});
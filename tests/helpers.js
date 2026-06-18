import request from 'supertest';
import app from '../src/app.js';

export async function loginAsAdmin() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@stockflow.dev',
      password: '123456'
    });

  if (!response.body.token) {
    throw new Error('Token não retornado. Rode migrations e seed antes dos testes de integração.');
  }

  return response.body.token;
}

export function authHeader(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export { app, request };

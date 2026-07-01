import request from 'supertest';
import app from '../src/app';

export { request, app };

export async function loginAsAdmin() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'owner@stockflow.dev',
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
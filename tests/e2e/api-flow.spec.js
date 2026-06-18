const { test, expect, request } = require('@playwright/test');

test('fluxo API: login, listar produtos e dashboard', async ({ baseURL }) => {
  const api = await request.newContext({ baseURL });

  const login = await api.post('/api/auth/login', {
    data: {
      email: 'admin@stockflow.dev',
      password: '123456'
    }
  });

  expect(login.ok()).toBeTruthy();
  const loginBody = await login.json();
  const token = loginBody.token;

  const products = await api.get('/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(products.ok()).toBeTruthy();

  const dashboard = await api.get('/api/dashboard/summary', {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(dashboard.ok()).toBeTruthy();
});

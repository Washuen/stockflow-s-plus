import { describe, it, expect } from 'vitest';
import permissionsModule from '../../src/utils/permissions.js';

const { can } = permissionsModule;

describe('permissions', () => {
  it('ADMIN deve ter acesso total', () => {
    expect(can('ADMIN', 'products:delete')).toBe(true);
    expect(can('ADMIN', 'users:create')).toBe(true);
  });

  it('SALES deve criar vendas, mas não criar produtos', () => {
    expect(can('SALES', 'sales:create')).toBe(true);
    expect(can('SALES', 'products:create')).toBe(false);
  });

  it('STOCK deve movimentar estoque, mas não acessar despesas', () => {
    expect(can('STOCK', 'stock:create')).toBe(true);
    expect(can('STOCK', 'expenses:read')).toBe(false);
  });

  it('FINANCE deve acessar financeiro, mas não alterar estoque', () => {
    expect(can('FINANCE', 'expenses:create')).toBe(true);
    expect(can('FINANCE', 'stock:create')).toBe(false);
  });
});

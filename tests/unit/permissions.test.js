import { describe, it, expect } from 'vitest';
import { permissions, can } from '../../src/utils/permissions';

describe('permissions', () => {
  it('ADMIN deve ter acesso total', () => {
    expect(can('ADMIN', 'products:create')).toBe(true);
    expect(can('ADMIN', 'users:delete')).toBe(true);
    expect(can('ADMIN', 'qualquer:permissao')).toBe(true);
  });

  it('OWNER deve ter acesso total mesmo sem estar no mapa de permissões', () => {
    expect(can('OWNER', 'products:create')).toBe(true);
    expect(can('OWNER', 'users:delete')).toBe(true);
    expect(can('OWNER', 'qualquer:permissao')).toBe(true);
  });

  it('MANAGER deve ter permissões amplas, mas controladas', () => {
    expect(can('MANAGER', 'dashboard:read')).toBe(true);
    expect(can('MANAGER', 'products:create')).toBe(true);
    expect(can('MANAGER', 'users:reactivate')).toBe(true);
    expect(can('MANAGER', 'system:dangerous')).toBe(false);
  });

  it('SALES deve criar vendas, mas não criar produtos', () => {
    expect(can('SALES', 'dashboard:read')).toBe(true);
    expect(can('SALES', 'sales:create')).toBe(true);
    expect(can('SALES', 'products:read')).toBe(true);
    expect(can('SALES', 'products:create')).toBe(false);
  });

  it('STOCK deve movimentar estoque, mas não acessar despesas', () => {
    expect(can('STOCK', 'dashboard:read')).toBe(true);
    expect(can('STOCK', 'stock:create')).toBe(true);
    expect(can('STOCK', 'reports:stock')).toBe(true);
    expect(can('STOCK', 'expenses:read')).toBe(false);
  });

  it('FINANCE deve acessar financeiro, mas não alterar estoque', () => {
    expect(can('FINANCE', 'dashboard:read')).toBe(true);
    expect(can('FINANCE', 'expenses:create')).toBe(true);
    expect(can('FINANCE', 'reports:finance')).toBe(true);
    expect(can('FINANCE', 'stock:create')).toBe(false);
  });

  it('deve retornar false para role inexistente', () => {
    expect(can('UNKNOWN_ROLE', 'products:read')).toBe(false);
  });

  it('deve retornar false para role vazia ou indefinida', () => {
    expect(can('', 'products:read')).toBe(false);
    expect(can(undefined, 'products:read')).toBe(false);
    expect(can(null, 'products:read')).toBe(false);
  });

  it('deve retornar false para permissão inexistente dentro de role válida', () => {
    expect(can('SALES', 'users:delete')).toBe(false);
    expect(can('STOCK', 'sales:create')).toBe(false);
    expect(can('FINANCE', 'products:update')).toBe(false);
  });

  it('deve expor o mapa de permissões esperado', () => {
    expect(permissions.ADMIN).toContain('*');
    expect(permissions.MANAGER).toContain('users:reactivate');
    expect(permissions.STOCK).toContain('stock:create');
    expect(permissions.SALES).toContain('sales:create');
    expect(permissions.FINANCE).toContain('expenses:create');
  });
});
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwtUtils from '../../src/utils/jwt';

const { signToken, verifyToken } = jwtUtils;

describe('jwt utils', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeEach(() => {
    process.env.JWT_SECRET = 'stockflow-test-secret';
    delete process.env.JWT_EXPIRES_IN;
  });

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalJwtExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
    }
  });

  it('deve gerar e validar token com payload do usuário', () => {
    const user = {
      id: 'user-123',
      role: 'OWNER',
      companyId: 'company-123'
    };

    const token = signToken(user);
    const decoded = verifyToken(token);

    expect(token).toBeTruthy();
    expect(decoded.sub).toBe(user.id);
    expect(decoded.role).toBe(user.role);
    expect(decoded.companyId).toBe(user.companyId);
    expect(decoded.iat).toBeTruthy();
    expect(decoded.exp).toBeTruthy();
  });

  it('deve usar expiração padrão de 7 dias quando JWT_EXPIRES_IN não estiver definido', () => {
    delete process.env.JWT_EXPIRES_IN;

    const user = {
      id: 'user-default-expiration',
      role: 'ADMIN',
      companyId: 'company-default'
    };

    const token = signToken(user);
    const decoded = verifyToken(token);

    const expiresInSeconds = decoded.exp - decoded.iat;

    expect(expiresInSeconds).toBe(7 * 24 * 60 * 60);
  });

  it('deve respeitar JWT_EXPIRES_IN customizado', () => {
    process.env.JWT_EXPIRES_IN = '1h';

    const user = {
      id: 'user-custom-expiration',
      role: 'MANAGER',
      companyId: 'company-custom'
    };

    const token = signToken(user);
    const decoded = verifyToken(token);

    const expiresInSeconds = decoded.exp - decoded.iat;

    expect(expiresInSeconds).toBe(60 * 60);
  });

  it('deve falhar ao validar token inválido', () => {
    expect(() => verifyToken('token-invalido')).toThrow();
  });

  it('deve falhar ao validar token assinado com outro segredo', () => {
    const user = {
      id: 'user-wrong-secret',
      role: 'SALES',
      companyId: 'company-secret'
    };

    process.env.JWT_SECRET = 'secret-original';
    const token = signToken(user);

    process.env.JWT_SECRET = 'secret-diferente';

    expect(() => verifyToken(token)).toThrow();
  });
});
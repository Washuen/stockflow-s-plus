import { describe, it, expect, vi, afterEach } from 'vitest';
import errorMiddleware from '../../src/middlewares/errorMiddleware';

const { notFound, errorHandler } = errorMiddleware;

function createResponseMock() {
  const res = {
    status: vi.fn(),
    json: vi.fn()
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

describe('errorMiddleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar 404 para rota não encontrada', () => {
    const req = {
      originalUrl: '/api/rota-inexistente'
    };
    const res = createResponseMock();

    notFound(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Rota não encontrada',
      path: '/api/rota-inexistente'
    });
  });

  it('deve tratar erro de validação ZodError com status 400', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = {
      name: 'ZodError',
      issues: [
        {
          path: ['email'],
          message: 'E-mail inválido'
        }
      ]
    };

    const req = {};
    const res = createResponseMock();
    const next = vi.fn();

    errorHandler(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Erro de validação',
      issues: error.issues
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve tratar erro com statusCode definido', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Acesso negado');
    error.statusCode = 403;

    const req = {};
    const res = createResponseMock();
    const next = vi.fn();

    errorHandler(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Acesso negado'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve usar status 500 quando erro não possuir statusCode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Falha inesperada');

    const req = {};
    const res = createResponseMock();
    const next = vi.fn();

    errorHandler(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Falha inesperada'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve usar mensagem padrão quando erro não possuir message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = {
      statusCode: 500
    };

    const req = {};
    const res = createResponseMock();
    const next = vi.fn();

    errorHandler(error, req, res, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Erro interno do servidor'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
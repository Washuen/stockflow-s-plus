function notFound(req, res) {
  return res.status(404).json({
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
}

function errorHandler(error, req, res, next) {
  console.error('[StockFlow API Error]', error);

  if (error.name === 'ZodError') {
    return res.status(400).json({
      message: 'Erro de validação',
      issues: error.issues
    });
  }

  return res.status(error.statusCode || 500).json({
    message: error.message || 'Erro interno do servidor'
  });
}

module.exports = {
  notFound,
  errorHandler
};

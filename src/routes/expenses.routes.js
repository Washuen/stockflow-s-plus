const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const { expenseSchema } = require('../validators/schemas');
const financeService = require('../services/finance.service');

const router = express.Router();

router.get('/', authorize('expenses:read'), asyncHandler(async (req, res) => {
  const expenses = await financeService.listExpenses(req.companyId);
  res.json(expenses);
}));

router.post('/', authorize('expenses:create'), asyncHandler(async (req, res) => {
  const data = expenseSchema.parse(req.body);
  const expense = await financeService.createExpense(req.companyId, req.user.id, data);
  res.status(201).json(expense);
}));

router.patch('/:id/cancel', authorize('expenses:delete'), asyncHandler(async (req, res) => {
  const result = await financeService.cancelExpense(
    req.companyId,
    req.user.id,
    req.params.id,
    req.body?.reason || 'Cancelamento operacional'
  );

  res.json(result);
}));

router.patch('/:id/reactivate', authorize('expenses:delete'), asyncHandler(async (req, res) => {
  const result = await financeService.reactivateExpense(
    req.companyId,
    req.user.id,
    req.params.id,
    req.body?.reason || 'Reativação operacional'
  );

  res.json(result);
}));

router.delete('/:id', authorize('expenses:delete'), asyncHandler(async (req, res) => {
  const expense = await financeService.cancelExpense(
    req.companyId,
    req.user.id,
    req.params.id,
    'Cancelamento via rota compatível DELETE'
  );

  res.json(expense);
}));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const { stockMovementSchema } = require('../validators/schemas');
const stockService = require('../services/stock.service');

const router = express.Router();

router.get('/', authorize('stock:read'), asyncHandler(async (req, res) => {
  const movements = await stockService.listMovements(req.companyId);
  res.json(movements);
}));

router.post('/', authorize('stock:create'), asyncHandler(async (req, res) => {
  const data = stockMovementSchema.parse(req.body);
  const movement = await stockService.registerMovement(req.companyId, req.user.id, data);
  res.status(201).json(movement);
}));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const { saleSchema } = require('../validators/schemas');
const saleService = require('../services/sale.service');

const router = express.Router();

router.get('/', authorize('sales:read'), asyncHandler(async (req, res) => {
  const sales = await saleService.listSales(req.companyId);
  res.json(sales);
}));

router.post('/', authorize('sales:create'), asyncHandler(async (req, res) => {
  const data = saleSchema.parse(req.body);
  const sale = await saleService.createSale(req.companyId, req.user.id, data);
  res.status(201).json(sale);
}));

router.patch('/:id/cancel', authorize('sales:create'), asyncHandler(async (req, res) => {
  const sale = await saleService.cancelSale(req.companyId, req.user.id, req.params.id, req.body?.reason || 'Cancelamento operacional');
  res.json(sale);
}));

router.patch('/:id/reactivate', authorize('sales:create'), asyncHandler(async (req, res) => {
  const sale = await saleService.reactivateSale(req.companyId, req.user.id, req.params.id, req.body?.reason || 'Reativação operacional');
  res.json(sale);
}));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const analyticsService = require('../services/analytics.service');

const router = express.Router();

function getAnalyticsFilters(req) {
  return {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
}

router.get('/kpis', authorize('reports:read'), asyncHandler(async (req, res) => {
  const data = await analyticsService.getKpis(
    req.companyId,
    getAnalyticsFilters(req)
  );

  res.json(data);
}));

router.get('/sales', authorize('reports:read'), asyncHandler(async (req, res) => {
  const data = await analyticsService.getSalesAnalytics(
    req.companyId,
    getAnalyticsFilters(req)
  );

  res.json(data);
}));

router.get('/stock', authorize('reports:read'), asyncHandler(async (req, res) => {
  const data = await analyticsService.getStockAnalytics(
    req.companyId,
    getAnalyticsFilters(req)
  );

  res.json(data);
}));

router.get('/finance', authorize('reports:read'), asyncHandler(async (req, res) => {
  const data = await analyticsService.getFinanceAnalytics(
    req.companyId,
    getAnalyticsFilters(req)
  );

  res.json(data);
}));

router.get('/powerbi', authorize('reports:read'), asyncHandler(async (req, res) => {
  const data = await analyticsService.getPowerBiDataset(
    req.companyId,
    getAnalyticsFilters(req)
  );

  res.json(data);
}));

module.exports = router;
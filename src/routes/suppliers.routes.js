const express = require('express');
const { prisma } = require('../config/prisma');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorize('suppliers:read'), asyncHandler(async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: req.companyId },
    orderBy: { name: 'asc' }
  });
  res.json(suppliers);
}));

router.post('/', authorize('suppliers:create'), asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.create({
    data: {
      name: req.body.name,
      document: req.body.document,
      email: req.body.email,
      phone: req.body.phone,
      companyId: req.companyId
    }
  });
  res.status(201).json(supplier);
}));

module.exports = router;
